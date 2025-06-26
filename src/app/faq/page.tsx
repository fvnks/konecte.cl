import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MailQuestion } from "lucide-react";

const faqData = [
  {
    question: "¿Cuánto cuesta publicar en Konecte?",
    answer: "Nada. Publicar propiedades o solicitudes es 100% gratuito para personas y corredores. No cobramos por destacar ni por subir en la lista. Lo importante es la calidad del dato, no la posición."
  },
  {
    question: "¿Por qué publicar es gratis?",
    answer: "Porque creemos que la información vale más cuando fluye libremente. En Konecte no cobramos por publicar ni por destacar. Queremos que tanto personas como corredores puedan ofrecer o buscar propiedades sin barreras. Nuestro modelo de negocio está enfocado en entregar valor adicional a quienes necesitan gestión, automatización y datos de contacto."
  },
  {
    question: "¿Quiénes pueden usar Konecte?",
    answer: "Cualquier persona. Si tienes una propiedad que vender o arrendar, o si estás buscando dónde vivir, puedes publicar. Si eres corredor de propiedades, tienes funciones adicionales desde tu panel para gestionar mejor tus negocios."
  },
  {
    question: "¿Puedo usar esto si no soy corredor?",
    answer: "¡Sí! Konecte está hecho tanto para personas naturales como para corredores. Si tienes una propiedad para arrendar o vender, o estás buscando dónde vivir, puedes publicar, buscar y recibir respuestas sin tener que pagar ni registrarte como profesional. Solo necesitas ingresar los datos básicos y estar atento a los contactos."
  },
  {
    question: "¿Qué diferencia a Konecte de otros portales como Yapo o Portal Inmobiliario?",
    answer: "Konecte no cobra por publicar ni por destacar. Además, usamos Inteligencia Artificial para encontrar coincidencias entre lo que se busca y lo que se ofrece. Y puedes publicar directamente por WhatsApp, sin necesidad de llenar formularios largos."
  },
  {
    question: "¿Cómo se muestran los datos de contacto?",
    answer: "Las personas naturales pueden ver los datos de contacto de otras personas naturales y de corredores con plan pago activo. Los corredores con plan gratuito no pueden ver datos, solo publicar. Los corredores con plan pago pueden ver los datos completos de todos."
  },
  {
    question: "¿Puedo buscar propiedades aunque no tenga cuenta?",
    answer: "Sí. Puedes explorar libremente todas las publicaciones, pero si quieres guardar o gestionar las tuyas, recibir notificaciones o ver datos de contacto, te recomendamos crear una cuenta (es gratis)."
  },
  {
    question: "¿Qué es la publicación por WhatsApp?",
    answer: "Si no tienes tiempo de ingresar desde un computador, puedes enviar tu publicación por WhatsApp y el sistema la captura en una planilla inteligente. Luego podrás completarla desde tu panel cuando tengas tiempo. Lo llamamos Konecte Express."
  },
  {
    question: "¿Qué beneficios tiene pagar un plan como corredor?",
    answer: "Con un plan pago puedes: Ver datos de contacto completos. Recibir notificaciones automáticas si hay coincidencias. Usar un CRM, calendario de visitas, y herramientas que te ahorran tiempo. Tener un panel completo para tu gestión como corredor."
  },
  {
    question: "¿Konecte me ayuda a concretar negocios?",
    answer: "Sí. La plataforma cruza los datos automáticamente y te avisa si alguien publicó lo que tú estás buscando o si tú tienes lo que otro necesita. Puedes chatear con la persona directamente por WhatsApp si tienes plan pago."
  },
  {
    question: "¿Cómo evitan que corredores se hagan pasar por personas para ver datos gratis?",
    answer: "Contamos con validación de identidad y herramientas internas que detectan comportamientos sospechosos. Además, limitamos el número de visualizaciones gratuitas y el acceso a datos está restringido de forma segura."
  }
];

export default function FAQPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <MailQuestion className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Preguntas Frecuentes
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Encuentra respuestas a las dudas más comunes sobre Konecte.
        </p>
      </div>
      
      <Accordion type="single" collapsible className="w-full">
        {faqData.map((faq, index) => (
          <AccordionItem value={`item-${index}`} key={index}>
            <AccordionTrigger className="text-lg text-left hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-base text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
} 