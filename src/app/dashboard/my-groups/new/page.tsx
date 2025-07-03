import CreateGroupForm from './_components/CreateGroupForm';

export default function NewGroupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Crear un Nuevo Grupo</h1>
        <p className="text-muted-foreground">
          Crea un espacio para colaborar con tu equipo de corredores.
        </p>
      </div>
      <CreateGroupForm />
    </div>
  );
} 