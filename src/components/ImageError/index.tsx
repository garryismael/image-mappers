import { AlertTriangle } from "lucide-react";

export const ImageError = () => {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-red-50 text-red-500">
      <AlertTriangle className="mb-2" size={28} />
      <p>Erreur de chargement de l'image</p>
    </div>
  );
};
