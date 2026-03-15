import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
// Správné importy pro Firebase Functions
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import {
    Container,
    Paper,
    Typography,
    CircularProgress,
    Alert,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Snackbar,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    IconButton
} from '@mui/material';
import { Add as AddIcon, Close as CloseIcon } from '@mui/icons-material';

function UserManagement() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });
    const [processingId, setProcessingId] = useState(null);

    const [isAddUserDialogOpen, setAddUserDialogOpen] = useState(false);
    const [newUser, setNewUser] = useState({ name: '', email: '', password: '' });
    const [isCreatingUser, setCreatingUser] = useState(false);

    const isUserAdmin = currentUser?.claims?.admin === true;

    useEffect(() => {
        if (!isUserAdmin) {
            setLoading(false);
            return;
        }
        const q = query(collection(db, "registrationRequests"), where("status", "==", "pending"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requestsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(requestsData);
            setLoading(false);
        }, (err) => {
            setError('Nepodařilo se načíst žádosti.');
            setLoading(false);
        });
        return () => unsubscribe();
    }, [isUserAdmin]);

    const handleApprove = async (requestId) => {
        setProcessingId(requestId);
        try {
            const functions = getFunctions(undefined, 'europe-west1');
            const approveRegistration = httpsCallable(functions, 'approveregistrationrequest');
            const result = await approveRegistration({ requestId });
            setFeedback({ open: true, message: result.data.message || 'Uživatel úspěšně schválen.', severity: 'success' });
        } catch (err) {
            console.error("Chyba při volání funkce 'approveregistrationrequest':", err);
            setFeedback({ open: true, message: `Schválení selhalo: ${err.message}`, severity: 'error' });
        }
        setProcessingId(null);
    };
    
    const handleReject = async (requestId) => {
        setProcessingId(requestId);
        try {
            const requestRef = doc(db, "registrationRequests", requestId);
            await updateDoc(requestRef, { status: "rejected" });
            setFeedback({ open: true, message: 'Žádost byla zamítnuta.', severity: 'info' });
        } catch (err) {
            setFeedback({ open: true, message: `Zamítnutí selhalo: ${err.message}`, severity: 'error' });
        }
        setProcessingId(null);
    };

    const handleOpenAddUserDialog = () => setAddUserDialogOpen(true);
    const handleCloseAddUserDialog = () => {
        setAddUserDialogOpen(false);
        setNewUser({ name: '', email: '', password: '' });
    };
    const handleNewUserChange = (e) => setNewUser({ ...newUser, [e.target.name]: e.target.value });

    const handleCreateUser = async () => {
        if (!newUser.email || !newUser.password || !newUser.name) {
            setFeedback({ open: true, message: 'Vyplňte prosím všechna pole.', severity: 'warning' });
            return;
        }
        setCreatingUser(true);
        try {
            const functions = getFunctions(undefined, 'europe-west1');
            const createUser = httpsCallable(functions, 'createnewuserbyadmin');
            const result = await createUser({ 
                email: newUser.email, 
                password: newUser.password, 
                displayName: newUser.name 
            });
            setFeedback({ open: true, message: result.data.message || 'Uživatel úspěšně vytvořen.', severity: 'success' });
            handleCloseAddUserDialog();
        } catch (err) {
            console.error("Chyba při volání funkce 'createnewuserbyadmin':", err);
            setFeedback({ open: true, message: `Vytvoření uživatele selhalo: ${err.message}`, severity: 'error' });
        }
        setCreatingUser(false);
    };

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    if (!isUserAdmin) {
        return (
            <Container maxWidth="md">
                <Alert severity="error" sx={{ mt: 4 }}>
                    Přístup odepřen. Tato stránka je dostupná pouze pro administrátory.
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{py: 4}}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                    Správa registrací
                </Typography>
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleOpenAddUserDialog}
                >
                    Přidat uživatele
                </Button>
            </Box>

            <Paper elevation={2}>
                <Typography variant="h6" component="h2" sx={{ p: 2, borderBottom: '1px solid #eee' }}>
                    Čekající žádosti o registraci
                </Typography>
                {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
                {!loading && requests.length === 0 && (
                    <Typography sx={{ p: 2, color: 'text.secondary' }}>
                        Aktuálně nejsou žádné nové žádosti o registraci.
                    </Typography>
                )}
                {requests.length > 0 && (
                     <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{fontWeight: 'bold'}}>Jméno</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>E-mail</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Firma</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Datum žádosti</TableCell>
                                    <TableCell align="right" sx={{fontWeight: 'bold'}}>Akce</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {requests.map((req) => (
                                    <TableRow key={req.id} hover>
                                        <TableCell>{req.name}</TableCell>
                                        <TableCell>{req.email}</TableCell>
                                        <TableCell>{req.company || '—'}</TableCell>
                                        <TableCell>{req.createdAt?.toDate().toLocaleDateString('cs-CZ')}</TableCell>
                                        <TableCell align="right">
                                            <Button variant="contained" color="success" size="small" sx={{ mr: 1 }} onClick={() => handleApprove(req.id)} disabled={processingId === req.id}>
                                                {processingId === req.id ? <CircularProgress size={20} color="inherit" /> : 'Schválit'}
                                            </Button>
                                            <Button variant="outlined" color="error" size="small" onClick={() => handleReject(req.id)} disabled={processingId === req.id}>
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

            <Dialog open={isAddUserDialogOpen} onClose={handleCloseAddUserDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Přidat nového uživatele
                    <IconButton onClick={handleCloseAddUserDialog}><CloseIcon /></IconButton>
                </DialogTitle>
                <DialogContent>
                    <TextField autoFocus margin="dense" id="name" name="name" label="Celé jméno" type="text" fullWidth variant="outlined" value={newUser.name} onChange={handleNewUserChange} />
                    <TextField margin="dense" id="email" name="email" label="E-mailová adresa" type="email" fullWidth variant="outlined" value={newUser.email} onChange={handleNewUserChange} />
                    <TextField margin="dense" id="password" name="password" label="Heslo" type="password" fullWidth variant="outlined" value={newUser.password} onChange={handleNewUserChange} />
                </DialogContent>
                <DialogActions sx={{ p: '16px 24px' }}>
                    <Button onClick={handleCloseAddUserDialog}>Zrušit</Button>
                    <Button onClick={handleCreateUser} variant="contained" disabled={isCreatingUser}>
                        {isCreatingUser ? <CircularProgress size={24} /> : 'Vytvořit účet'}
                    </Button>
                </DialogActions>
            </Dialog>

             <Snackbar open={feedback.open} autoHideDuration={6000} onClose={() => setFeedback({...feedback, open: false})} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setFeedback({...feedback, open: false})} severity={feedback.severity} sx={{ width: '100%' }} variant="filled">
                    {feedback.message}
                </Alert>
            </Snackbar>
        </Container>
    );
}

export default UserManagement;
