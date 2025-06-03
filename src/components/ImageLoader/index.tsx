import { Loader } from "lucide-react";

export const ImageLoader = () => {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
      <Loader className="animate-spin text-gray-500" size={32} />
    </div>
  );
};
