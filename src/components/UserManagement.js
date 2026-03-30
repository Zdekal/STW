import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, serverTimestamp } from "firebase/firestore";

import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

/**
 * Admin: schvalování uživatelů.
 * Pozn.: bez Cloud Functions nelze bezpečně "vytvářet účty" za uživatele –
 * tento screen proto řeší pouze approval gate nad profilem ve Firestore.
 */
export default function UserManagement() {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    if (!db) {
      setError("Firestore není inicializovaný (zkontrolujte .env)." );
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (e) => {
        console.error(e);
        setError("Nepodařilo se načíst žádosti.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [isAdmin]);

  const approve = async (uid) => {
    setProcessing(uid);
    try {
      await updateDoc(doc(db, "users", uid), {
        status: "approved",
        approvedAt: serverTimestamp(),
        approvedBy: currentUser?.uid || null,
      });
    } catch (e) {
      console.error(e);
      setError(e?.message || "Schválení selhalo.");
    } finally {
      setProcessing(null);
    }
  };

  const reject = async (uid) => {
    setProcessing(uid);
    try {
      await updateDoc(doc(db, "users", uid), {
        status: "disabled",
        disabledAt: serverTimestamp(),
        disabledBy: currentUser?.uid || null,
      });
    } catch (e) {
      console.error(e);
      setError(e?.message || "Zamítnutí selhalo.");
    } finally {
      setProcessing(null);
    }
  };

  if (!isAdmin) {
    return (
      <Container maxWidth="md">
        <Alert severity="error" sx={{ mt: 4 }}>
          Přístup odepřen. Tato stránka je dostupná pouze administrátorovi.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: "bold", mb: 3 }}>
        Správa registrací
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={2}>
        <Typography variant="h6" sx={{ p: 2, borderBottom: "1px solid #eee" }}>
          Čekající účty (pending)
        </Typography>

        {rows.length === 0 ? (
          <Typography sx={{ p: 2, color: "text.secondary" }}>
            Aktuálně nejsou žádné nové žádosti.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Jméno</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>E-mail</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Firma</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Vytvořeno</TableCell>
                  <TableCell align="right" sx={{ fontWeight: "bold" }}>Akce</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.displayName || "—"}</TableCell>
                    <TableCell>{u.email || "—"}</TableCell>
                    <TableCell>{u.company || "—"}</TableCell>
                    <TableCell>
                      {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString("cs-CZ") : "—"}
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        sx={{ mr: 1 }}
                        onClick={() => approve(u.id)}
                        disabled={processing === u.id}
                      >
                        {processing === u.id ? <CircularProgress size={18} color="inherit" /> : "Schválit"}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => reject(u.id)}
                        disabled={processing === u.id}
                      >
                        Zamítnout
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Alert severity="info" sx={{ mt: 2 }}>
        Poznámka: Tento režim schvalování je postavený na poli <b>users/&lt;uid&gt;.status</b>. Pokud budete chtít
        "admin vytváří uživatele" nebo složitější workflow, je vhodné to přesunout do Cloud Functions.
      </Alert>
    </Container>
  );
}
