import React, { useState } from "react";
import {
  ShieldCheck,
  Key,
  Server,
  Zap,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";


interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToVault?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onNavigateToVault,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleFinish = () => {
    if (dontShowAgain) {
      localStorage.setItem("zyntratek_onboarding_seen", "true");
    } else {
      localStorage.removeItem("zyntratek_onboarding_seen");
    }
    onClose();
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep((prev) => prev + 1);
    else handleFinish();
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep((prev) => prev - 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none">
      <div className="relative w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="p-5 border-b border-border bg-card/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight">
                Guía de Inicio Rápido: Claves y Contraseñas
              </h2>
              <p className="text-xs text-muted-foreground">
                Aprende en 3 sencillos pasos cómo conectar tus servidores de forma automatizada y segura.
              </p>
            </div>
          </div>
          <button
            onClick={handleFinish}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-colors"
            title="Cerrar guía"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="px-6 pt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <button
                key={step}
                onClick={() => setCurrentStep(step)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  currentStep === step
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : currentStep > step
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-secondary text-muted-foreground border border-border"
                }`}
              >
                {currentStep > step ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <span>{step}</span>
                )}
                <span>
                  {step === 1 ? "Vault" : step === 2 ? "Conexión" : "Conectar"}
                </span>
              </button>
            ))}
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Paso {currentStep} de 3
          </span>
        </div>

        {/* Body Content */}
        <div className="p-6 flex-1 min-h-[320px] flex flex-col justify-between">
          {/* SLIDE 1: CREAR EN EL VAULT */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400">
                  <Key className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Paso 1: Guarda tus Contraseñas en el Vault Cifrado
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Antes de crear una conexión, guarda tus contraseñas o claves SSH privadas en el **Vault**. Las claves nunca se guardan en texto plano y quedan protegidas por el almacén de seguridad de tu equipo.
                  </p>
                  {onNavigateToVault && (
                    <button
                      onClick={() => {
                        onNavigateToVault();
                        handleFinish();
                      }}
                      className="mt-2 text-xs text-primary hover:underline font-sans font-semibold flex items-center gap-1"
                    >
                      <span>Ir a la pestaña Vault ahora mismo</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>


              {/* Visual Card Example */}
              <div className="bg-secondary/60 border border-border rounded-xl p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-emerald-400" /> Formulario de Credencial
                  </span>
                  <span className="text-primary font-sans font-semibold">Pestaña Vault</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">Nombre de la Credencial</span>
                    <div className="bg-background/80 border border-border rounded-lg px-2.5 py-1.5 text-foreground font-sans">
                      Servidores Proxmox / Root
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">Tipo</span>
                    <div className="bg-background/80 border border-border rounded-lg px-2.5 py-1.5 text-foreground font-sans">
                      Contraseña
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase">Contraseña / Clave Secreta</span>
                  <div className="bg-background/80 border border-border rounded-lg px-2.5 py-1.5 text-emerald-400 flex items-center justify-between">
                    <span>••••••••••••••••</span>
                    <Lock className="h-3 w-3 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 2: VINCULAR A LA CONEXION */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400">
                  <Server className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Paso 2: Selecciona la Credencial en tu Conexión
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Al crear o editar cualquier servidor SSH o RDP en **Nueva Conexión**, despliega el menú **Credencial (Vault)** y elige la clave que guardaste en el Paso 1.
                  </p>
                </div>
              </div>

              {/* Visual Card Example */}
              <div className="bg-secondary/60 border border-border rounded-xl p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-border text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Server className="h-3.5 w-3.5 text-primary" /> Formulario de Conexión (SSH / RDP)
                  </span>
                  <span className="text-emerald-400 font-sans font-semibold">Vinculación</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">Host / IP</span>
                    <div className="bg-background/80 border border-border rounded-lg px-2.5 py-1.5 text-foreground">
                      10.100.10.5
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase">Usuario</span>
                    <div className="bg-background/80 border border-border rounded-lg px-2.5 py-1.5 text-foreground">
                      localadmin
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-primary uppercase font-bold flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" /> Credencial (Vault)
                  </span>
                  <div className="bg-primary/10 border border-primary/40 rounded-lg px-2.5 py-1.5 text-primary font-sans font-semibold flex items-center justify-between shadow-xs">
                    <span>Servidores Proxmox / Root (Password)</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SLIDE 3: CONEXION AUTOMATICA O AL VUELO */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400">
                  <Zap className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    Paso 3: ¡Conéctate con 1 Clic o al Vuelo!
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Si vinculaste la credencial, tus sesiones SSH y RDP iniciarán **al instante y sin pedirte la clave**. Si preferiste no guardarla, aparecerá la ventana emergente para escribir la clave al vuelo y guardarla en el Vault con 1 solo clic.
                  </p>
                </div>
              </div>

              {/* Visual Card Example */}
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 space-y-3 font-sans text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>¡Todo listo para conectar tus servidores de forma profesional!</span>
                </div>
                <p className="text-muted-foreground leading-relaxed text-[11px]">
                  Puedes reabrir esta guía en cualquier momento haciendo clic en el icono de **Ayuda `?`** ubicado en la barra superior de la aplicación.
                </p>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="rounded border-border bg-secondary text-primary focus:ring-1 focus:ring-primary"
              />
              <span>No volver a mostrar este tutorial al iniciar la app</span>
            </label>

            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <button
                  onClick={prevStep}
                  className="px-3.5 py-1.5 border border-border bg-secondary text-foreground text-xs font-semibold rounded-xl hover:bg-secondary/80 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
              )}
              <button
                onClick={nextStep}
                className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <span>{currentStep === 3 ? "¡Entendido, Empezar!" : "Siguiente"}</span>
                {currentStep < 3 && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
