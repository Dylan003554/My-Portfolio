const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

// Fichier local sécurisé (/tmp sur Vercel/Node)
const TRACKER_FILE = path.join('/tmp', 'sent-emails-store.json');
const MAX_EMAILS_PER_ACCOUNT = 2;              // Max 2 envois
const COOLDOWN_MS = 60000;                    // 60 secondes entre 2 envois
const TIME_WINDOW_24H = 24 * 60 * 60 * 1000;  // Fenêtre de 24h (en ms)

function getEmailRecords() {
    try {
        if (fs.existsSync(TRACKER_FILE)) {
            const data = fs.readFileSync(TRACKER_FILE, 'utf8');
            return JSON.parse(data) || {};
        }
    } catch (e) {
        console.error('[Tracker] Erreur lecture fichier:', e);
    }
    return {};
}

function saveEmailRecords(records) {
    try {
        fs.writeFileSync(TRACKER_FILE, JSON.stringify(records, null, 2), 'utf8');
    } catch (e) {
        console.error('[Tracker] Erreur écriture fichier:', e);
    }
}

module.exports = async function handler(req, res) {
    // Configuration CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Méthode non autorisée. Seul POST est accepté.' });
    }

    try {
        const { credential, subject, message, honeypot, name: clientName } = req.body || {};

        // 1. Honeypot check (bot trap)
        if (honeypot && honeypot.trim() !== '') {
            return res.status(200).json({ success: true, message: 'Message envoyé avec succès.' });
        }

        // 2. Validation des champs de base
        if (!credential) {
            return res.status(400).json({ error: 'Authentification Google requise (Token ID manquant).' });
        }
        if (!message || message.trim() === '') {
            return res.status(400).json({ error: 'Le champ message est obligatoire.' });
        }

        // 3. Vérification du token ID auprès des serveurs Google
        const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
        const client = new OAuth2Client(googleClientId);

        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken: credential,
                audience: googleClientId,
            });
        } catch (authError) {
            console.error('[Backend Vercel] Erreur de vérification du token Google:', authError);
            return res.status(401).json({ error: 'Jeton d\'authentification Google invalide ou expiré.' });
        }

        const payload = ticket.getPayload();
        if (!payload || !payload.email_verified) {
            return res.status(401).json({ error: 'Compte ou adresse email Google non vérifié.' });
        }

        // --- Données certifiées extraites directement du jeton Google ---
        const verifiedEmail = payload.email;
        const verifiedName  = payload.name || clientName || 'Visiteur Google';

        // 4. SUIVI ET RESTRICTION : MAX 2 ENVOIS PAR 24H ET COOLDOWN DE 60S
        const records = getEmailRecords();
        const emailKey = verifiedEmail.toLowerCase().trim();
        let userSends = records[emailKey] || [];
        const now = Date.now();

        // Filtrer et ne garder que les envois effectués dans les dernières 24h
        userSends = userSends.filter(timestamp => (now - timestamp) < TIME_WINDOW_24H);

        // 4a. Cooldown de 60 secondes entre deux envois
        const lastSent = userSends.length > 0 ? userSends[userSends.length - 1] : 0;
        if (lastSent > 0 && (now - lastSent < COOLDOWN_MS)) {
            return res.status(429).json({ error: 'Trop de tentatives d\'envoi' });
        }

        // 4b. Bloquer si l'adresse email a atteint la limite de 2 envois en 24h
        if (userSends.length >= MAX_EMAILS_PER_ACCOUNT) {
            return res.status(429).json({ error: 'Trop de tentatives d\'envoi' });
        }

        // 5. Envoi via l'API REST officielle EmailJS
        const serviceId  = process.env.EMAILJS_SERVICE_ID || 'service_hpvtp3b';
        const templateId = process.env.EMAILJS_TEMPLATE_ID || 'template_3fq4c9n';
        const publicKey  = process.env.EMAILJS_PUBLIC_KEY || 'iL_aGupBFyMkdP6fm';
        const privateKey = process.env.EMAILJS_PRIVATE_KEY;

        const emailJsPayload = {
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            template_params: {
                name: verifiedName,
                email: verifiedEmail,
                subject: subject ? `[Vérifié Google] ${subject}` : '[Vérifié Google] Message depuis le Portfolio',
                message: message
            }
        };

        if (privateKey && privateKey.trim() !== '') {
            emailJsPayload.accessToken = privateKey.trim();
        }

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailJsPayload)
        });

        if (response.ok) {
            // Mettre à jour l'historique des envois pour cette adresse email
            userSends.push(now);
            records[emailKey] = userSends;
            saveEmailRecords(records);

            return res.status(200).json({
                success: true,
                message: '✓ Message envoyé avec succès !',
                verifiedEmail: verifiedEmail
            });
        } else {
            const errorText = await response.text();
            console.error('[Backend Vercel] Erreur API EmailJS:', errorText);
            return res.status(500).json({ error: `Erreur EmailJS (${response.status}): ${errorText}` });
        }

    } catch (err) {
        console.error('[Backend Vercel] Erreur serveur:', err);
        return res.status(500).json({ error: 'Erreur interne du serveur lors du traitement.' });
    }
};
