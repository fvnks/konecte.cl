// src/app/legal/terms/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollText } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline flex items-center">
            <ScrollText className="h-8 w-8 mr-3 text-primary" />
            Términos y Condiciones
          </CardTitle>
          <CardDescription>
            Última actualización: {new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-muted-foreground prose prose-sm sm:prose-base max-w-none">
          <p className="font-bold text-lg text-center">
            TÉRMINOS Y CONDICIONES PARA USUARIOS Y OFERENTES DEL SITIO KONECTE SPA.
          </p>

          <p>
            El presente documento informa a los usuarios (los "Usuarios") y oferentes ("Oferentes") de la página web www.konecte.cl (el "Portal" o el "Sitio") las Condiciones Particulares del Uso del Sitio, incluyendo los alcances, limitaciones y condiciones relativas a la información expuesta en el Sitio.
          </p>
          <p>
            Todo Usuario u Oferente por el sólo hecho de usar y/o publicar en este Sitio acepta este documento, las Condiciones Generales de Uso y la Política de Privacidad del Sitio.
          </p>

          <h2 className="text-xl font-semibold text-card-foreground">1) Sobre la información de la plataforma</h2>
          <p>El Portal no es dueño de las propiedades ni de los productos ofrecidos, ni es el prestador de los servicios publicados en el Portal, por lo que:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>El Portal no tiene información de las propiedades ni de los atributos de otros productos publicados, más allá de lo que aparece en el Sitio, y NO es parte del servicio ofrecido por el Portal la verificación de los datos publicados por los Usuarios y/o Oferentes.</li>
            <li>El Portal no garantiza la calidad del producto o servicio ofrecido por quienes publican en el Sitio, ni se constituye en garante de los compromisos de una o ambas partes.</li>
            <li>El Portal no asume responsabilidad alguna por los perjuicios o daños que pudiera significar para algún Usuario, los defectos o características del diseño o construcción de una propiedad publicada, o la eventual inconveniencia o perjuicio económico o moral que pudiera ocasionarle un negocio finiquitado, en curso o fallido, generado a partir de una propiedad u otro producto ofrecido en el Portal.</li>
          </ul>

          <h2 className="text-xl font-semibold text-card-foreground">2) Comercialización de propiedades</h2>
          <p>El Portal no es quien comercializa las propiedades publicadas. Por tanto:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>El Sitio no tiene injerencia alguna en el diseño, construcción, gestión comercial o en cualquier otra actividad vinculada con los productos y propiedades que aparecen en el Sitio, más allá de ser un medio de publicación en Internet.</li>
            <li>La información publicada es de exclusiva responsabilidad de las personas o de las empresas que la exponen a través de los servicios ofrecidos por el Portal.</li>
            <li>El Portal no garantiza que las imágenes publicadas asociadas a las propiedades u otros productos sean fidedignas o ajustadas a la realidad, estén libres de retoques o, cuando corresponda, cuenten con los derechos que autorizan su publicación, ni que los textos descriptivos de las propiedades, proyectos o productos sean estrictamente fieles a la realidad, todo lo publicado es de exclusiva responsabilidad de quien lo ofrece o publica.</li>
            <li>El Portal no garantiza que eventos publicados como promociones representen condiciones más favorables que las habituales para los proyectos, propiedades o productos, ni tampoco garantiza su cumplimiento por parte de la empresa o particular Oferente.</li>
            <li>Finalmente, el Portal no garantiza que las propiedades o los productos publicados como disponibles lo estén en la realidad.</li>
          </ul>
          
          <h2 className="text-xl font-semibold text-card-foreground">3) Responsabilidad del Usuario</h2>
          <p>De acuerdo a lo señalado en los números anteriores, será de responsabilidad del Usuario verificar directamente con el Oferente las condiciones de la oferta publicada, precio y disponibilidad de la propiedad, producto o servicio. Consecuentemente con lo indicado anteriormente, se advierte expresamente que es de total responsabilidad del Usuario, iniciar cualquier tipo de acción, por los perjuicios que hubiere podido experimentar, por pérdida de tiempo o dinero, a partir de información inexacta de una propiedad o del no cumplimiento de términos y condiciones ofrecidos por los Oferentes.</p>

          <h2 className="text-xl font-semibold text-card-foreground">4) Validez de la Información</h2>
          <p>La información entregada a través del Portal, en especial en lo referente a precios y formas de pago, no tiene validez legal y/o comercial desde el punto de vista que un Usuario pueda exigir que un determinado negocio se lleve a cabo a partir de datos entregados en el Portal.</p>

          <h3 className="text-lg font-bold text-card-foreground mt-8 pt-4 border-t">Condiciones Particulares adicionales para los Oferentes del Sitio</h3>
          
          <h4 className="text-lg font-semibold text-card-foreground">1. Registro de Usuario</h4>
          <p>Toda persona natural o jurídica, para publicar una o más propiedades, nuevas y/o usadas, o cualquier otro producto, bajo cualquier nivel de servicio que ofrezca en el Portal el Oferente, deberá estar registrado como Usuario. En consecuencia, y como señalamos anteriormente, declara conocer y aceptar.</p>

          <h4 className="text-lg font-semibold text-card-foreground">2. Aceptación de Condiciones</h4>
          <p>Por el solo hecho de solicitar la publicación de alguna propiedad, producto o servicio en el Portal, el Oferente declara conocer y aceptar los alcances y limitaciones del Sitio, incluyendo las condiciones particulares y generales de uso de este Sitio así como su Política de Privacidad.</p>
          <p>En este sentido, el Oferente declara conocer y aceptar la posibilidad de acceso al contenido del Portal a través de sitios afiliados y reconoce y acepta que pueden producirse cambios en el contenido del Portal, no estando éste obligado a informarlos cada vez que se produzcan, salvo que éstos involucren directamente el contenido de la información publicada por el Oferente, caso en el cual el Oferente podrá siempre solicitar que la información por él publicada sea eliminada del Portal.</p>
          
          <h4 className="text-lg font-semibold text-card-foreground">3. Catalogación y Exhibición</h4>
          <p>El Oferente declara reconocer y aceptar la atribución del Portal para catalogar y exhibir, bajo distintos criterios, la información publicada por el Oferente; sin perjuicio de lo cual el Oferente podrá revocar la autorización de uso y pedir la remoción de la(s) imagen(es) de las secciones donde éstas se exhibieran.</p>
          
          <h4 className="text-lg font-semibold text-card-foreground">4. Gestión de Publicaciones</h4>
          <p>Las publicaciones, conexiones y solicitudes de conexión de alguna propiedad, producto o servicio en el Portal pueden ser vistas y gestionadas por www.konecte.cl.</p>

          <h4 className="text-lg font-semibold text-card-foreground">5. Visitas y Estadísticas</h4>
          <p>El Portal no garantiza la obtención de un número mínimo de visitas, conexiones, solicitudes de conexión y/o registro de datos de potenciales interesados en los productos que ofrezca el Oferente ni asume responsabilidad alguna en los eventuales daños o perjuicios de cualquier naturaleza que pudieran atribuirse a la ausencia de visitas o registros. El Oferente declara conocer y aceptar que los datos aportados al Portal, podrán ser utilizados por éste para generar estadísticas generales de oferta que libremente podrá comercializar, así como estadísticas relacionadas con la demanda en base a las consultas y visitas realizadas.</p>
          
          <h4 className="text-lg font-semibold text-card-foreground">6. Disponibilidad del Servicio</h4>
          <p>El Oferente declara conocer que el Portal no puede garantizar la ausencia de incidencias, suspensiones e interrupciones en la red. En consecuencia, el Oferente exime de toda responsabilidad al Sitio por los daños y perjuicios de cualquier clase que pudieran deberse a eventuales fallas en su funcionamiento, que sean ajenas a su voluntad y/o control y que impidan el normal acceso de los Usuarios al Sitio.</p>
          
          <h4 className="text-lg font-semibold text-card-foreground">7. Responsabilidad del Oferente</h4>
          <ul className="list-disc pl-5 space-y-2">
            <li>La información publicada relativa a su persona, a la empresa a la que representa (si es el caso) y a su(s) proyecto(s), propiedad(es) y/o productos o servicios en venta o arriendo, sea de carácter gráfico, precios o contenido de textos.</li>
            <li>El Oferente es responsable y, por tanto, libera y exime expresamente al Portal de toda responsabilidad ante eventuales reclamos o demandas de terceros, por publicación de material o datos no autorizados, información errónea, desactualizada, publicidad engañosa y en general por cualquier concepto emanado de la información publicada o del servicio ofrecido por el Oferente en el Sitio.</li>
            <li>El Portal tampoco será responsable de los eventuales perjuicios para el Oferente, que pudieran resultar de la utilización de datos por parte de personas o instituciones para fines distintos de los perseguidos por el Oferente, tales como estudios de mercado u oferta de servicios. En este sentido, el Oferente declara conocer y aceptar que cada dato relativo a su propiedad, proyecto o producto queda disponible para toda persona que pueda acceder al Portal, y que el Sitio no discrimina ni restringe la navegación por él más allá del registro de Usuario.</li>
            <li>
              En relación a la mantención y actualización de la información, será responsabilidad del Oferente:
                <ul className="list-disc pl-8 space-y-1 mt-2">
                  <li>La revisión inicial e indicación de cambios, en caso que correspondan, dentro de las 48 horas desde la habilitación del servicio respectivo en el Portal;</li>
                  <li>Informar claramente la cantidad de Stock del producto, o propiedades de acuerdo a todas las exigencias de la Ley del Consumidor vigente.</li>
                  <li>La revisión permanente de la información publicada, a fin que ésta corresponda a una versión correcta y actualizada;</li>
                  <li>Notificar al Portal cuando deban realizarse cambios que no puedan ser ejecutados directamente por el Oferente; y</li>
                  <li>Notificar al Portal el fin del período de venta o arriendo para un proyecto o propiedad, o término de stock de un producto, con un plazo máximo de tres (3) días hábiles con posterioridad a su venta o arriendo (o de la última unidad disponible en el caso de proyectos y de productos no únicos).</li>
                  <li>En caso de contar con servicios o funcionalidades que le permitan la recepción de datos de los Usuarios del Portal, el Oferente se obliga a mantener estricta reserva y confidencialidad de ellos.</li>
                  <li>Los registros sólo podrán ser usados para ser contactados con propósitos vinculados a la venta o arriendo de unidades del proyecto, la propiedad, o el producto vinculado a la vivienda en virtud del cual se generaron.</li>
                  <li>El Oferente tiene prohibido usar datos generados por un proyecto para propósitos de venta o arriendo de uno distinto.</li>
                  <li>Igualmente, el Oferente se compromete a que en caso de realizar seguimiento, por sí mismo o a través de la contratación de un servicio externo, llevará a efecto dichas prácticas procurando no importunar al Usuario registrado, afectar su privacidad o contrariar su disposición a no seguir recibiendo comunicaciones por parte del Oferente.</li>
                </ul>
            </li>
          </ul>

          <h4 className="text-lg font-semibold text-card-foreground">8. Condiciones mínimas de publicación</h4>
          <p>El Oferente, al publicar en el Sitio, deberá informar al menos lo siguiente:</p>
          <ul className="list-disc pl-8 space-y-1">
            <li>Ubicación (al menos comuna)</li>
            <li>Precio en pesos o UF</li>
            <li>Superficie construida, terreno (si corresponde)</li>
            <li>Número de dormitorios y número de baños, y si tiene o no dependencias de servicio</li>
            <li>Fotografías obligatorias y/o renders, de la cual el Oferente debe ser titular de todos los derechos o tener una autorización legal para el uso de los mismos, de lo contrario comete infracciones a la ley.</li>
            <li>Una observación referida al inmueble con un máximo de 2.000 caracteres.</li>
          </ul>
          <p>No está permitido incluir información sobre condiciones del contrato, servicios adicionales, y/o de procedimiento.</p>
          <p>El Portal se reserva el derecho de publicar únicamente aquellas solicitudes que, bajo su propio criterio, entreguen información suficiente, ordenada y relacionada con los servicios prestados por el Sitio.</p>
          <p>El Portal no publicará, o si ya ha sido publicada, podrá eliminar, información que según su criterio sea errónea, pueda inducir a errores, pueda ser considerada como publicidad engañosa, o pudiera estimarse contraria a derecho o a las buenas costumbres.</p>
          
          <h4 className="text-lg font-semibold text-card-foreground">9. Uso de imágenes</h4>
          <p>Por el solo hecho de presentar imágenes en su solicitud de publicación, el Oferente declara que cuenta o es titular o está expresamente autorizado por el titular y tiene los respectivos permisos o derechos de publicación. El Portal no asume responsabilidad alguna frente a terceros en el evento que la publicación de las imágenes en el Sitio no cuente con la autorización correspondiente.</p>
          <p>La reproducción o clonación de imágenes sin autorización corresponde a una apropiación indebida que atenta contra las buenas prácticas que el Portal busca promover. Sin embargo:</p>
          <ul className="list-disc pl-8 space-y-1">
            <li>No es parte del servicio que ofrece el Portal, investigar y pronunciarse sobre la veracidad y autoría de una imagen, y por tanto, el Oferente podrá denunciar ante las autoridades y/o tribunales competentes lo que su a juicio corresponde a la copia de una determinada imagen, pero no podrá exigir al Portal su eliminación, ni exigir al Sitio respuesta a su denuncia.</li>
            <li>El Portal, en razón de un buen servicio, podrá eliminar imágenes que razonablemente interprete como réplicas y, según sea la gravedad del caso, eliminar la publicación de la propiedad o producto asociado.</li>
            <li>En el cumplimiento de este propósito, el Portal puede erróneamente eliminar alguna imagen que resultase ser original y el Oferente reconoce esta eventualidad como un riesgo del servicio y acepta su ocurrencia como desprovista de toda intencionalidad de imputación valórica por parte del Portal.</li>
            <li>El Sitio podrá eliminar imágenes donde aparezcan niños y personas reales; secuencias de imágenes que ocupen el formato definido para una sola de ellas (Gif animados); e imágenes con efectos gráficos que de alguna forma pudieran significar problemas de apreciación.</li>
            <li>El Oferente autoriza expresamente al Portal para eliminar imágenes que incorporen logotipos, textos, códigos de identificación, o cualquier otro tipo de distintivo, o bien eliminar dichos distintivos, en la medida que esto sea posible, mediante una intervención gráfica, sin necesidad de aviso previo ni posterior.</li>
          </ul>

          <h4 className="text-lg font-semibold text-card-foreground">10. Publicación de propiedades arrendadas o vendidas</h4>
          <ul className="list-disc pl-8 space-y-1">
            <li>Bajo ninguna circunstancia podrá publicarse o mantenerse en publicación un proyecto o propiedad que se avise como "vendida" o "arrendada". Igualmente, en caso de un producto, que se avise como "agotado" o bajo cualquiera otra referencia que lo consigne como no disponible. Reiteramos la obligación siempre de mencionar el stock de productos en caso de que se trate de más de uno.</li>
            <li>El Portal se reserva el derecho de retirar en forma inmediata el proyecto, propiedad o producto que indique un estado que consigne que no está disponible o, que sin indicarlo, haya constancia que esté vendido o arrendado aun cuando pudiesen ser representativas de otras propiedades, proyectos o productos del Oferente.</li>
          </ul>

          <h4 className="text-lg font-semibold text-card-foreground">11. Plazos de publicación</h4>
          <ul className="list-disc pl-8 space-y-1">
              <li>La publicación de alguna propiedad, producto o servicio en el Portal debe cerrarse con el estado que corresponda, en caso de alguna conexión o se hubiere aceptado una solicitud de conexión. Si la publicación no ha tenido interacción se deberá dar de baja al momento de que ya no esté vigente. De todas maneras, en caso de que hayan pasado 30 días corridos desde la publicación, se enviará email al oferente de dicha publicación y en caso de no tener respuesta, ésta será eliminada de www.konecte.cl</li>
              <li>El Oferente autoriza expresamente al Portal para modificar, sin previo aviso, dicho plazo de publicación, el cual regirá a contar de la fecha en que sea modificado y publicado, por lo que será responsabilidad exclusiva del Oferente informarse acerca de los plazos de publicación y revisar periódicamente el estado de publicación de su(s) propiedad(es) en el Sitio.</li>
              <li>El Oferente autoriza expresamente al Portal para prolongar dicho plazo sin previo aviso. Por su parte, el Oferente podrá prolongar el plazo inicial por uno o más períodos siguiendo las instrucciones que se señalan para este efecto, siempre y cuando esta opción se le presente como disponible. En todo caso, se deja constancia, que el Portal no está obligado a conceder extensiones al período inicial ni advertir mediante correo electrónico fechas de términos.</li>
              <li>El Oferente renuncia a toda acción de queja, denuncia o reclamo de cualquier otra naturaleza, contra el Sitio relativa a la suspensión de alguna publicación, sea ésta preestablecida o no, y haya sido o no previamente notificada.</li>
              <li>Será en todo momento, el Oferente el responsable de eliminar la publicación de la(s) propiedad(es), en caso de ser requerido, ya sea porque ha cambiado de estado de "disponible" a "vendida" o "arrendada", o por cualquier otro motivo, con anterioridad al vencimiento del plazo de 3 días hábiles.</li>
          </ul>
          
          <h4 className="text-lg font-semibold text-card-foreground">12. Plan de pago</h4>
          <h5 className="font-semibold text-card-foreground">a. Compra del Plan</h5>
          <p>www.konecte.cl te ofrece la posibilidad de pagar por visualizar las conexiones que se generen entre las publicaciones del oferente y los demás usuarios del portal. Además, es posible acceder a un panel de gestión y control de gestión de todos los movimientos dentro de la web como las publicaciones, conexiones y solicitudes de conexión.</p>
          <blockquote className="border-l-4 pl-4 italic">Para ser parte y poder suscribirse al plan primero el usuario debe estar registrado y aceptar los términos y condiciones de la web.</blockquote>
          
          <h5 className="font-semibold text-card-foreground">b. Renovación o modificación de plan de pago</h5>
          <p>Una vez que adquieras un plan, autorizas a www.konecte.cl a que efectúe el cobro a través del método de pago que hayas elegido. Si quieres cancelar o cambiar el método de pago, puedes hacerlo desde el menú 'configuración de pagos' que encontrarás en tu perfil. La suscripción al plan se renovará automáticamente hasta que decidas cancelarla.</p>
          
          <h5 className="font-semibold text-card-foreground">c. Término del servicio del Plan</h5>
          <p>Si estás registrado con un plan, te puedes dar de baja en cualquier momento accediendo al apartado 'Eliminar cuenta' dentro del menú 'Configuración'. Guardaremos tus datos en caso de que decidas recuperar tu cuenta con posterioridad. Muchos usuarios deciden desactivar sus cuentas por razones de carácter temporal y, por ello, agradecen que sus datos sigan estando disponibles cuando regresan. Por este motivo, es posible restaurar una cuenta y perfil en su totalidad durante un plazo de 30 días desde su desactivación. Si decides dar de baja tu cuenta, nos reservamos el derecho a eliminar cualquier Contenido que hayas añadido o publicado en www.konecte.cl.</p>
          <blockquote className="border-l-4 pl-4 italic">El contenido que hayas añadido, exceptuando aquel en tu Perfil (como comentarios o mensajes de emails), puede seguir apareciendo tras haberte dado de baja.</blockquote>

          <h4 className="text-lg font-semibold text-card-foreground">13. Abusos y quejas</h4>
          <p>Puedes denunciar un abuso o realizar una queja sobre algún Contenido en www.konecte.cl a través del formulario que encontrarás en la siguiente página: <a href="https://badoo.com/es-cl/feedback/" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Página de contacto</a>. También puedes denunciar a un usuario directamente desde su perfil, haciendo clic en el enlace 'Bloquear o denunciar', eligiendo el asunto de la queja y añadiendo un comentario de lo sucedido y de lo que creas conveniente.</p>
          <blockquote className="border-l-4 pl-4 italic">Siempre haremos todo lo posible para resolver cualquier problema que puedas tener con nuestro servicio.</blockquote>

          <h4 className="text-lg font-semibold text-card-foreground">14. Uso de información por parte de Usuarios y/o Oferentes</h4>
          <p>Los Usuarios y/o Oferentes no podrán hacer usos comerciales de la información publicada en www.konecte.cl. Esto incluye la promoción de cualquier bien o servicio. En el caso que se utilice con fines comerciales, no comerciales, periodísticos, académicos u otros, deberá el sitio ser citado como fuente, con previo aviso y validación por parte de KONECTE SPA. En el caso de incumplir el punto anterior, KONECTE SPA podrá ejercer las acciones legales respectivas al caso.</p>

        </CardContent>
      </Card>
    </div>
  );
}
