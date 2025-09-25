import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useApi } from "../hooks/useApi";
import { useAuth } from "../contexts/AuthContext";
import { useApiCall } from "../hooks/useApiCall";
import { toast } from "sonner@2.0.3";
import {
  ArrowLeft,
  Save,
  Edit,
  Clock,
  User,
  Monitor,
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileText,
  Activity,
} from "lucide-react";

interface Ticket {
  id: number;
  title: string;
  description?: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  asset_id?: number;
  reported_by: string;
  assigned_to?: string;
  assets: {
    id: number;
    name: string;
    serial_number?: string;
    asset_types?: {
      name: string;
    };
  } | null;
  reported_by_profile: {
    id: string;
    full_name: string;
  } | null;
  assigned_to_profile: {
    id: string;
    full_name: string;
  } | null;
}

interface Profile {
  id: string;
  full_name: string;
  role_id: number;
}

interface Asset {
  id: number;
  name: string;
  serial_number?: string;
  asset_types: {
    name: string;
  };
}

interface TicketDetailsProps {
  ticket: Ticket;
  onBack: () => void;
  onUpdate: () => void;
}

const PRIORITIES = [
  {
    value: "baja",
    label: "Baja",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  {
    value: "media",
    label: "Media",
    color:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
  {
    value: "alta",
    label: "Alta",
    color:
      "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
  {
    value: "critica",
    label: "Crítica",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
];

const STATUSES = [
  {
    value: "abierto",
    label: "Abierto",
    color:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  {
    value: "en_progreso",
    label: "En Progreso",
    color:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  },
  {
    value: "pendiente",
    label: "Pendiente",
    color:
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  },
  {
    value: "resuelto",
    label: "Resuelto",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  {
    value: "cerrado",
    label: "Cerrado",
    color:
      "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  },
];

const getPriorityInfo = (priority: string) => {
  return (
    PRIORITIES.find(
      (p) => p.value === priority?.toLowerCase(),
    ) || {
      value: priority,
      label: priority || "Sin prioridad",
      color: "bg-gray-100 text-gray-800",
    }
  );
};

const getStatusInfo = (status: string) => {
  return (
    STATUSES.find((s) => s.value === status?.toLowerCase()) || {
      value: status,
      label: status || "Sin estado",
      color: "bg-gray-100 text-gray-800",
    }
  );
};

export function TicketDetails({
  ticket,
  onBack,
  onUpdate,
}: TicketDetailsProps) {
  const { user, isAuthenticated } = useAuth();
  const { apiCall } = useApiCall();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(ticket);
  const [formData, setFormData] = useState({
    title: ticket.title || "",
    description: ticket.description || "",
    priority: ticket.priority?.toLowerCase() || "media",
    status: ticket.status?.toLowerCase() || "abierto",
    asset_id: ticket.asset_id
      ? ticket.asset_id.toString()
      : "none",
    assigned_to: ticket.assigned_to || "unassigned",
  });

  const { data: profiles } = useApi<Profile[]>(
    "/profiles?for_assignment=true",
  );
  const { data: assets } = useApi<Asset[]>("/assets");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Hace menos de una hora";
    if (diffInHours < 24)
      return `Hace ${diffInHours} ${diffInHours === 1 ? "hora" : "horas"}`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7)
      return `Hace ${diffInDays} ${diffInDays === 1 ? "día" : "días"}`;

    return formatDate(dateString);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [ticket.id]);

  // Initialize form data when ticket changes
  useEffect(() => {
    setCurrentTicket(ticket);
    setFormData({
      title: ticket.title || "",
      description: ticket.description || "",
      priority: ticket.priority?.toLowerCase() || "media",
      status: ticket.status?.toLowerCase() || "abierto",
      asset_id: ticket.asset_id
        ? ticket.asset_id.toString()
        : "none",
      assigned_to: ticket.assigned_to || "unassigned",
    });
  }, [ticket]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!isAuthenticated || !user) {
      toast.error(
        "Debes estar autenticado para realizar esta acción",
      );
      return;
    }

    if (!formData.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }

    setIsSaving(true);
    try {
      const ticketData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        priority: formData.priority,
        status: formData.status,
        asset_id:
          formData.asset_id && formData.asset_id !== "none"
            ? parseInt(formData.asset_id)
            : null,
        assigned_to:
          formData.assigned_to &&
          formData.assigned_to !== "unassigned"
            ? formData.assigned_to
            : null,
      };

      const updatedTicket = await apiCall(
        `/tickets/${ticket.id}`,
        {
          method: "PATCH",
          body: ticketData,
        },
      );

      // Update local ticket data with the response
      setCurrentTicket(updatedTicket);

      toast.success("Ticket actualizado correctamente");
      setIsEditing(false);

      // Only notify parent that data changed, don't reset view
      onUpdate();
    } catch (error) {
      console.error("Error updating ticket:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al actualizar el ticket",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: currentTicket.title || "",
      description: currentTicket.description || "",
      priority:
        currentTicket.priority?.toLowerCase() || "media",
      status: currentTicket.status?.toLowerCase() || "abierto",
      asset_id: currentTicket.asset_id
        ? currentTicket.asset_id.toString()
        : "none",
      assigned_to: currentTicket.assigned_to || "unassigned",
    });
    setIsEditing(false);
  };

  const priorityInfo = getPriorityInfo(currentTicket.priority);
  const statusInfo = getStatusInfo(currentTicket.status);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <Button
            variant="outline"
            onClick={onBack}
            className="h-9 sm:h-10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden xs:inline">Volver</span>
            <span className="xs:hidden">Atrás</span>
          </Button>
          <div className="min-w-0">
            <h2 className="text-lg sm:text-2xl font-bold truncate">
              Ticket TK
              {currentTicket.id.toString().padStart(4, "0")}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Detalles del ticket de soporte
            </p>
          </div>
        </div>
        <div className="flex flex-col xs:flex-row gap-2 w-full sm:w-auto">
          {isEditing ? (
            <>
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isSaving}
                className="w-full xs:w-auto h-9 sm:h-10"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !formData.title.trim()}
                className="w-full xs:w-auto h-9 sm:h-10"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Guardando..." : "Guardar"}
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setIsEditing(true)}
              className="w-full sm:w-auto h-9 sm:h-10"
            >
              <Edit className="w-4 h-4 mr-2" />
              <span className="hidden xs:inline">
                Editar Ticket
              </span>
              <span className="xs:hidden">Editar</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Información principal */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Detalles del ticket */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">
                  {isEditing
                    ? "Editando Ticket"
                    : "Detalles del Ticket"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-3 sm:px-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <Label
                      htmlFor="title"
                      className="text-sm font-medium"
                    >
                      Título del Ticket *
                    </Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange(
                          "title",
                          e.target.value,
                        )
                      }
                      placeholder="Describe brevemente el problema..."
                      className="mt-1 h-9 sm:h-10"
                    />
                  </div>

                  <div>
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium"
                    >
                      Descripción Detallada
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange(
                          "description",
                          e.target.value,
                        )
                      }
                      placeholder="Proporciona todos los detalles posibles sobre el problema..."
                      rows={4}
                      className="mt-1 text-sm resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="priority"
                        className="text-sm font-medium"
                      >
                        Prioridad
                      </Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) =>
                          handleInputChange("priority", value)
                        }
                      >
                        <SelectTrigger className="mt-1 h-9 sm:h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITIES.map((priority) => (
                            <SelectItem
                              key={priority.value}
                              value={priority.value}
                            >
                              <span className="text-sm">
                                {priority.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label
                        htmlFor="status"
                        className="text-sm font-medium"
                      >
                        Estado
                      </Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) =>
                          handleInputChange("status", value)
                        }
                      >
                        <SelectTrigger className="mt-1 h-9 sm:h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((status) => (
                            <SelectItem
                              key={status.value}
                              value={status.value}
                            >
                              <div className="flex items-center gap-2">
                                {status.value === "abierto" && (
                                  <Clock className="w-4 h-4" />
                                )}
                                {status.value ===
                                  "en_progreso" && (
                                  <AlertTriangle className="w-4 h-4" />
                                )}
                                {(status.value === "resuelto" ||
                                  status.value ===
                                    "cerrado") && (
                                  <CheckCircle className="w-4 h-4" />
                                )}
                                {status.value ===
                                  "pendiente" && (
                                  <Clock className="w-4 h-4" />
                                )}
                                <span className="text-sm">
                                  {status.label}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label
                        htmlFor="asset"
                        className="text-sm font-medium"
                      >
                        Equipo Relacionado
                      </Label>
                      <Select
                        value={formData.asset_id}
                        onValueChange={(value) =>
                          handleInputChange("asset_id", value)
                        }
                      >
                        <SelectTrigger className="mt-1 h-9 sm:h-10">
                          <SelectValue placeholder="Sin equipo específico" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            Sin equipo específico
                          </SelectItem>
                          {assets?.map((asset) => (
                            <SelectItem
                              key={asset.id}
                              value={asset.id.toString()}
                            >
                              <div className="flex flex-col items-start">
                                <span className="text-sm font-medium">
                                  {asset.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {asset.asset_types.name}
                                  {asset.serial_number &&
                                    ` • S/N: ${asset.serial_number}`}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label
                        htmlFor="assigned_to"
                        className="text-sm font-medium"
                      >
                        Asignado a
                      </Label>
                      <Select
                        value={formData.assigned_to}
                        onValueChange={(value) =>
                          handleInputChange(
                            "assigned_to",
                            value,
                          )
                        }
                      >
                        <SelectTrigger className="mt-1 h-9 sm:h-10">
                          <SelectValue placeholder="Sin asignar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">
                            Sin asignar
                          </SelectItem>
                          {profiles?.map((profile) => (
                            <SelectItem
                              key={profile.id}
                              value={profile.id}
                            >
                              <span className="text-sm">
                                {profile.full_name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="font-medium mb-2 text-sm sm:text-base">
                      Título
                    </h4>
                    <p className="text-sm sm:text-base text-foreground break-words">
                      {currentTicket.title}
                    </p>
                  </div>

                  {currentTicket.description && (
                    <div>
                      <h4 className="font-medium mb-2 text-sm sm:text-base">
                        Descripción
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {currentTicket.description}
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-muted-foreground">
                          Creado:
                        </span>
                        <p className="break-words">
                          {formatDate(currentTicket.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-muted-foreground">
                          Actualizado:
                        </span>
                        <p className="break-words">
                          {formatRelativeTime(
                            currentTicket.updated_at,
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-muted-foreground">
                          Reportado por:
                        </span>
                        <p className="break-words">
                          {currentTicket.reported_by_profile
                            ?.full_name || "Desconocido"}
                        </p>
                      </div>
                    </div>
                    {currentTicket.assets && (
                      <div className="flex items-start gap-2">
                        <Monitor className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <span className="text-muted-foreground">
                            Equipo:
                          </span>
                          <p className="break-words">
                            {currentTicket.assets.name}
                          </p>
                          {currentTicket.assets.asset_types
                            ?.name && (
                            <p className="text-xs text-muted-foreground">
                              (
                              {
                                currentTicket.assets.asset_types
                                  .name
                              }
                              )
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Historial de cambios */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span className="truncate">
                  Historial del Ticket
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-3 sm:px-6">
              <div className="space-y-3">
                <div className="border rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3 sm:w-4 sm:h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-xs sm:text-sm truncate">
                        {
                          currentTicket.reported_by_profile
                            ?.full_name
                        }
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(
                          currentTicket.created_at,
                        )}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm ml-9 sm:ml-10">
                    Ticket creado
                  </p>
                </div>

                {currentTicket.updated_at !==
                  currentTicket.created_at && (
                  <div className="border rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-xs sm:text-sm">
                          Sistema
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(
                            currentTicket.updated_at,
                          )}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm ml-9 sm:ml-10">
                      Ticket actualizado
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="space-y-4 sm:space-y-6">
          {/* Estado y Prioridad */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base">
                Estado Actual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-3 sm:px-6">
              <div>
                <label className="text-xs sm:text-sm font-medium mb-2 block">
                  Estado
                </label>
                <Badge className={statusInfo.color}>
                  {statusInfo.label}
                </Badge>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium mb-2 block">
                  Prioridad
                </label>
                <Badge className={priorityInfo.color}>
                  {priorityInfo.label}
                </Badge>
              </div>

              <div>
                <label className="text-xs sm:text-sm font-medium mb-2 block">
                  Asignado a
                </label>
                <p className="text-xs sm:text-sm break-words">
                  {currentTicket.assigned_to_profile
                    ?.full_name || "Sin asignar"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Información adicional */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm sm:text-base">
                Información del Ticket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm px-3 sm:px-6">
              <div>
                <span className="text-muted-foreground">
                  ID del Ticket:
                </span>
                <p className="font-mono">
                  TK
                  {currentTicket.id.toString().padStart(4, "0")}
                </p>
              </div>

              {currentTicket.assets && (
                <>
                  <Separator />
                  <div>
                    <span className="text-muted-foreground">
                      Equipo Relacionado:
                    </span>
                    <p className="font-medium break-words">
                      {currentTicket.assets.name}
                    </p>
                    {currentTicket.assets.asset_types?.name && (
                      <p className="text-xs text-muted-foreground">
                        Tipo:{" "}
                        {currentTicket.assets.asset_types.name}
                      </p>
                    )}
                    {currentTicket.assets.serial_number && (
                      <p className="text-xs text-muted-foreground font-mono break-all">
                        S/N:{" "}
                        {currentTicket.assets.serial_number}
                      </p>
                    )}
                  </div>
                </>
              )}

              <Separator />
              <div>
                <span className="text-muted-foreground">
                  Creado:
                </span>
                <p className="break-words">
                  {formatDate(currentTicket.created_at)}
                </p>
              </div>

              <div>
                <span className="text-muted-foreground">
                  Última actualización:
                </span>
                <p className="break-words">
                  {formatRelativeTime(currentTicket.updated_at)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}