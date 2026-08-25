const { OAuth2Client } = require('google-auth-library');

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

        // --- Données certifiées et extraites directement du jeton signé par Google ---
        const verifiedEmail = payload.email;
        const verifiedName  = payload.name || clientName || 'Visiteur Google';

        // 4. Envoi sécurisé via l'API REST officielle de EmailJS
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

        if (privateKey) {
            emailJsPayload.accessToken = privateKey;
        }

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(emailJsPayload)
        });

        if (response.ok) {
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
