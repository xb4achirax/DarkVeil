// src/controllers/whatsappController.js

/**
 * Handles redirecting the user to WhatsApp with a prefilled message.
 * It uses the WHATSAPP_NUMBER from the environment variables.
 */
export const redirectToWhatsApp = (req, res) => {
    try {
        const { product } = req.query;
        
        // Get WhatsApp number from environment variables
        const whatsappNumber = process.env.WHATSAPP_NUMBER;
        
        if (!whatsappNumber) {
            console.error('WHATSAPP_NUMBER is not defined in .env');
            return res.status(500).json({ error: 'WhatsApp configuration is missing.' });
        }

        // Construct the message
        const productName = product || 'one of your products';
        const message = `Hi, I'm interested in the ${productName}`;
        
        // Construct the WhatsApp URL
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
        
        // Redirect the client to WhatsApp
        res.redirect(whatsappUrl);
    } catch (error) {
        console.error('Error in redirectToWhatsApp:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
