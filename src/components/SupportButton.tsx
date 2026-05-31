import { Mail } from 'lucide-react';

const SUPPORT_EMAIL = 'apbjunior100@hotmail.com';

export default function SupportButton() {
  return (
    <a
      href={`mailto:${SUPPORT_EMAIL}?subject=Suporte LeveMotors`}
      title="Falar com o suporte"
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-full shadow-lg hover:bg-primary/90 hover:-translate-y-0.5 transition-all duration-200 text-sm font-medium"
    >
      <Mail className="h-4 w-4" />
      Suporte
    </a>
  );
}
