import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "./ui/alert";
import { useAuth } from "../contexts/AuthContext";
import {
  Eye,
  EyeOff,
  Shield,
  AlertCircle,
  Loader2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner@2.0.3";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email || !password) {
      const errorMsg = "Por favor, completa todos los campos";
      setError(errorMsg);
      toast.error("Campos requeridos", {
        description: errorMsg,
      });
      setIsLoading(false);
      return;
    }

    console.log("🔐 LoginPage: Attempting login for:", email);
    const result = await login(email, password);

    if (!result.success) {
      const errorMsg =
        result.error || "Error al iniciar sesión";
      console.log("❌ LoginPage: Login failed:", errorMsg);
      setError(errorMsg);

      // Show toast notification for better UX
      toast.error("Error de autenticación", {
        description: errorMsg,
        duration: 5000,
      });
    } else {
      console.log("✅ LoginPage: Login successful");
      toast.success("¡Bienvenido!", {
        description: "Acceso concedido al sistema",
      });
    }

    setIsLoading(false);
  };

  // Clear error when user starts typing
  useEffect(() => {
    if (error && (email || password)) {
      setError("");
    }
  }, [email, password, error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold">Innova TI</h1>
          <p className="text-muted-foreground">
            Panel de Administración - Solo personal autorizado
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-lg border-0 bg-card/50 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              Iniciar Sesión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50 dark:bg-red-950/30"
                >
                  <XCircle className="h-5 w-5" />
                  <AlertTitle>Error de Acceso</AlertTitle>
                  <AlertDescription className="text-sm mt-1">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">
                  Correo Electrónico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@institucion.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="bg-input-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    disabled={isLoading}
                    className="bg-input-background pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando credenciales...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Sistema de Administración de Inventario IT</p>
          <p className="text-xs mt-1">
            Institución Educativa © 2025
          </p>
        </div>
      </div>
    </div>
  );
}