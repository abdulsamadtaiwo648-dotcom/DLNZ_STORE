export const WHATSAPP_NUMBER = '2349071809866';
export const WHATSAPP_LINK = (message: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
