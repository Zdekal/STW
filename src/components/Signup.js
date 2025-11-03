import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
    Container, 
    Paper, 
    Typography, 
    TextField, 
    Button, 
    CircularProgress, 
    Alert,
    Box 
} from '@mui/material';

/**
 * Komponenta Signup - Krok 1: Žádost o registraci
 * Tento formulář již nevytváří uživatele přímo. Místo toho odešle žádost
 * o registraci do databáze Firestore, která bude čekat na schválení administrátorem.
 */
function Signup() {
    const [name, setName] = useState('');
    const [company, setCompany] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [requestSent, setRequestSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!name || !email || !password) {
            setError('Prosím, vyplňte všechna povinná pole.');
            setLoading(false);
            return;
        }

        try {
            // Vytvoříme dokument v nové kolekci 'registrationRequests'
            await addDoc(collection(db, "registrationRequests"), {
                name: name,
                company: company,
                email: email,
                password: password, // Viz bezpečnostní poznámka níže
                status: 'pending', // Stav žádosti je "čekající na schválení"
                createdAt: serverTimestamp()
            });

            // Zobrazíme uživateli potvrzovací zprávu
            setRequestSent(true);

        } catch (err) {
            console.error("Chyba při odesílání žádosti o registraci: ", err);
            setError('Při odesílání žádosti došlo k chybě. Zkuste to prosím znovu.');
        }

        setLoading(false);
    };

    // --- BEZPEČNOSTNÍ UPOZORNĚNÍ ---
    // Ukládání hesla v čitelné podobě (plaintext) do databáze je extrémně
    // nebezpečné a v produkčním prostředí by se nemělo nikdy používat.
    // Tento přístup je zde zvolen pouze jako dočasný krok pro demonstrační
    // účely, protože Cloud Function bude toto heslo potřebovat k vytvoření účtu.
    // V reálné aplikaci by se proces řešil jinak (např. odesláním odkazu
    // pro nastavení hesla až po schválení).

    // Pokud byla žádost úspěšně odeslána, zobrazíme děkovnou obrazovku.
    if (requestSent) {
        return (
            <Container component="main" maxWidth="sm" sx={{ mt: 8 }}>
                <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h5" component="h1" gutterBottom>
                        Děkujeme za Váš zájem!
                    </Typography>
                    <Typography variant="body1">
                        Vaše žádost o registraci byla úspěšně odeslána a čeká na schválení.
                        Jakmile bude váš účet aktivován, budeme vás informovat e-mailem.
                    </Typography>
                    <Button component={Link} to="/login" variant="contained" sx={{ mt: 4 }}>
                        Zpět na přihlášení
                    </Button>
                </Paper>
            </Container>
        );
    }

    // Jinak zobrazíme standardní registrační formulář.
    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ p: 4, mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">
                    Žádost o registraci
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="name"
                        label="Celé jméno"
                        name="name"
                        autoComplete="name"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        id="company"
                        label="Firma (nepovinné)"
                        name="company"
                        autoComplete="organization"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="E-mailová adresa"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Heslo"
                        type="password"
                        id="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Požádat o registraci'}
                    </Button>
                    <Box textAlign="center">
                        <Link to="/login" variant="body2">
                            Máte již účet? Přihlaste se
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}

export default Signup;
