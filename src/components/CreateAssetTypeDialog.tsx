import React, { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useApiCall } from "../hooks/useApiCall";
import { toast } from "sonner@2.0.3";
import {
  Plus,
  Monitor,
  Laptop,
  Printer,
  Tablet,
  Smartphone,
  Camera,
  Projector,
  Headphones,
  Router,
  Server,
  Tag,
  Sparkles,
} from "lucide-react";

interface CreateAssetTypeDialogProps {
  onAssetTypeCreated?: () => void;
  trigger?: React.ReactNode;
}

// Iconos sugeridos para diferentes tipos de equipos
const suggestedIcons = [
  { icon: Monitor, name: "Monitor", label: "Monitor/Pantalla" },
  { icon: Laptop, name: "Laptop", label: "Laptop/Portátil" },
  { icon: Printer, name: "Printer", label: "Impresora" },
  { icon: Tablet, name: "Tablet", label: "Tablet/iPad" },
  {
    icon: Smartphone,
    name: "Smartphone",
    label: "Teléfono/Móvil",
  },
  { icon: Camera, name: "Camera", label: "Cámara" },
  { icon: Projector, name: "Projector", label: "Proyector" },
  {
    icon: Headphones,
    name: "Headphones",
    label: "Audífonos/Audio",
  },
  { icon: Router, name: "Router", label: "Router/Red" },
  { icon: Server, name: "Server", label: "Servidor" },
];

// Tipos de equipos sugeridos con descripciones
const suggestedTypes = [
  {
    name: "Laptop",
    description:
      "Computadoras portátiles para uso educativo y administrativo",
  },
  {
    name: "Monitor",
    description:
      "Pantallas externas y monitores de diversos tamaños",
  },
  {
    name: "Proyector",
    description:
      "Equipos de proyección para aulas y salas de conferencias",
  },
  {
    name: "Tablet",
    description:
      "Dispositivos táctiles para educación interactiva",
  },
  {
    name: "Impresora",
    description:
      "Equipos de impresión láser, inyección de tinta y multifuncionales",
  },
  {
    name: "Cámara Web",
    description:
      "Cámaras para videoconferencias y grabación de contenido",
  },
  {
    name: "Bocinas",
    description: "Sistemas de audio para aulas y eventos",
  },
  {
    name: "Router",
    description:
      "Equipos de networking y conectividad inalámbrica",
  },
  {
    name: "UPS",
    description: "Sistemas de alimentación ininterrumpible",
  },
  {
    name: "Escáner",
    description: "Equipos de digitalización de documentos",
  },
];

export function CreateAssetTypeDialog({
  onAssetTypeCreated,
  trigger,
}: CreateAssetTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState<
    string | null
  >(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const { apiCall } = useApiCall();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSuggestedTypeClick = (type: {
    name: string;
    description: string;
  }) => {
    setFormData({
      name: type.name,
      description: type.description,
    });
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setSelectedIcon(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(
        "El nombre del tipo de equipo es obligatorio",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const assetTypeData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
      };

      await apiCall("/asset-types", {
        method: "POST",
        body: assetTypeData,
      });

      toast.success("Tipo de equipo creado correctamente");
      resetForm();
      setOpen(false);
      onAssetTypeCreated?.();
    } catch (error) {
      console.error("Error creating asset type:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al crear el tipo de equipo",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 w-full xs:w-auto"
    >
      <Plus className="w-4 h-4" />
      <span className="hidden xs:inline">Nuevo Tipo</span>
      <span className="xs:hidden">Tipo</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <DialogHeader className="px-1 sm:px-0">
          <DialogTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-3 text-left">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex-shrink-0">
              <Tag className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl">
                Crear Nuevo Tipo de Equipo
              </h2>
              <p className="text-sm text-muted-foreground font-normal">
                Define un nuevo tipo de equipo para el
                inventario
              </p>
            </div>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Completa la información del nuevo tipo de equipo.
            Puedes usar las sugerencias o crear uno
            personalizado.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 pb-4"
          >
            {/* Tipos sugeridos */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <Label className="text-sm font-medium">
                  Tipos Sugeridos
                </Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 sm:max-h-48 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {suggestedTypes.map((type) => (
                  <button
                    key={type.name}
                    type="button"
                    onClick={() =>
                      handleSuggestedTypeClick(type)
                    }
                    className="p-2 sm:p-3 text-left border border-border rounded-lg hover:border-primary/50 hover:bg-accent/50 transition-all duration-200 group"
                  >
                    <div className="font-medium text-xs sm:text-sm group-hover:text-primary transition-colors">
                      {type.name}
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {type.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Separador visual */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  o personalizar
                </span>
              </div>
            </div>

            {/* Campos del formulario */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Campo de nombre */}
                <div className="lg:col-span-1">
                  <Label
                    htmlFor="asset_type_name"
                    className="text-sm font-medium"
                  >
                    Nombre del Tipo *
                  </Label>
                  <Input
                    id="asset_type_name"
                    value={formData.name}
                    onChange={(e) =>
                      handleInputChange("name", e.target.value)
                    }
                    placeholder="Ej: Laptop, Proyector, Tablet..."
                    className="mt-2 h-9 sm:h-10"
                    required
                  />
                </div>

                {/* Iconos sugeridos */}
                <div className="lg:col-span-1">
                  <Label className="text-sm font-medium">
                    Icono Sugerido
                  </Label>
                  <div className="grid grid-cols-5 gap-1 mt-2">
                    {suggestedIcons.map((iconData) => {
                      const IconComponent = iconData.icon;
                      const isSelected =
                        selectedIcon === iconData.name;
                      return (
                        <button
                          key={iconData.name}
                          type="button"
                          onClick={() =>
                            setSelectedIcon(
                              isSelected ? null : iconData.name,
                            )
                          }
                          className={`
                            p-1.5 sm:p-2 rounded-lg border-2 transition-all duration-200
                            ${
                              isSelected
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:border-primary/50 hover:bg-accent/50"
                            }
                          `}
                          title={iconData.label}
                        >
                          <IconComponent className="w-3 h-3 sm:w-4 sm:h-4 mx-auto" />
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecciona un icono representativo
                    (opcional)
                  </p>
                </div>
              </div>

              {/* Campo de descripción */}
              <div>
                <Label
                  htmlFor="asset_type_description"
                  className="text-sm font-medium"
                >
                  Descripción
                </Label>
                <Textarea
                  id="asset_type_description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange(
                      "description",
                      e.target.value,
                    )
                  }
                  placeholder="Describe el tipo de equipo y su uso en la institución..."
                  rows={3}
                  className="mt-2 text-sm resize-none"
                />
              </div>
            </div>

            {/* Vista previa */}
            {(formData.name || formData.description) && (
              <div className="p-3 sm:p-4 bg-accent/50 border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-primary/20 rounded flex items-center justify-center">
                    {(() => {
                      if (selectedIcon) {
                        const IconComponent =
                          suggestedIcons.find(
                            (i) => i.name === selectedIcon,
                          )?.icon || Tag;
                        return (
                          <IconComponent className="w-3 h-3 text-primary" />
                        );
                      }
                      return (
                        <Tag className="w-3 h-3 text-primary" />
                      );
                    })()}
                  </div>
                  <span className="text-xs sm:text-sm font-medium">
                    Vista Previa
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-sm sm:text-base">
                    {formData.name || "Nombre del tipo"}
                  </div>
                  {formData.description && (
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {formData.description}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
                disabled={isSubmitting}
                className="w-full sm:w-auto h-9 sm:h-10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="gap-2 w-full sm:w-auto h-9 sm:h-10"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden sm:inline">
                      Creando...
                    </span>
                    <span className="sm:hidden">Creando</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      Crear Tipo de Equipo
                    </span>
                    <span className="sm:hidden">
                      Crear Tipo
                    </span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}