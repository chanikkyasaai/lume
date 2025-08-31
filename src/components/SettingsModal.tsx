import { useState, useEffect } from "react";
import { Settings, X, Check, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

interface SettingsModalProps {
  onConfigurationChange?: (isValid: boolean) => void;
}

const SettingsModal = ({ onConfigurationChange }: SettingsModalProps) => {
  const [open, setOpen] = useState(false);
  const [murfApiKey, setMurfApiKey] = useState("");
  const [assemblyApiKey, setAssemblyApiKey] = useState("");
  const [cerebrasApiKey, setCrebrasApiKey] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    murf: boolean | null;
    assembly: boolean | null;
    cerebras: boolean | null;
  }>({
    murf: null,
    assembly: null,
    cerebras: null
  });
  const [showKeys, setShowKeys] = useState({
    murf: false,
    assembly: false,
    cerebras: false
  });

  useEffect(() => {
    // Load saved API keys from localStorage only (no environment variables)
    const savedMurfKey = localStorage.getItem('murf_api_key') || '';
    const savedAssemblyKey = localStorage.getItem('assembly_api_key') || '';
    const savedCrebrasKey = localStorage.getItem('cerebras_api_key') || '';
    
    setMurfApiKey(savedMurfKey);
    setAssemblyApiKey(savedAssemblyKey);
    setCrebrasApiKey(savedCrebrasKey);

    // Check if configuration is valid
    const isValid = savedMurfKey.length > 0 && savedAssemblyKey.length > 0 && savedCrebrasKey.length > 0;
    onConfigurationChange?.(isValid);
  }, [onConfigurationChange]);

  const validateApiKey = async (service: string, apiKey: string): Promise<boolean> => {
    if (!apiKey.trim()) return false;

    try {
      switch (service) {
        case 'murf': {
          const murfResponse = await fetch('https://api.murf.ai/v1/speech/generate', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              text: 'test',
              voice: 'en-US-davis'
            })
          });
          return murfResponse.status !== 401; // 401 means invalid API key
        }

        case 'assembly': {
          const assemblyResponse = await fetch('https://api.assemblyai.com/v2/account', {
            headers: {
              'Authorization': apiKey,
              'Content-Type': 'application/json'
            }
          });
          return assemblyResponse.ok;
        }

        case 'cerebras': {
          const cerebrasResponse = await fetch('https://api.cerebras.ai/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          return cerebrasResponse.ok;
        }

        default:
          return false;
      }
    } catch (error) {
      console.error(`Error validating ${service} API key:`, error);
      return false;
    }
  };

  const handleSaveAndTest = async () => {
    setIsValidating(true);
    
    const results = {
      murf: await validateApiKey('murf', murfApiKey),
      assembly: await validateApiKey('assembly', assemblyApiKey),
      cerebras: await validateApiKey('cerebras', cerebrasApiKey)
    };
    
    setValidationResults(results);
    
    // Save to localStorage if keys are provided
    if (murfApiKey.trim()) localStorage.setItem('murf_api_key', murfApiKey.trim());
    if (assemblyApiKey.trim()) localStorage.setItem('assembly_api_key', assemblyApiKey.trim());
    if (cerebrasApiKey.trim()) localStorage.setItem('cerebras_api_key', cerebrasApiKey.trim());
    
    const allValid = results.murf && results.assembly && results.cerebras;
    onConfigurationChange?.(allValid);
    
    setIsValidating(false);
    
    if (allValid) {
      setTimeout(() => setOpen(false), 1500);
    }
  };

  const toggleKeyVisibility = (service: 'murf' | 'assembly' | 'cerebras') => {
    setShowKeys(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
  };

  const getValidationIcon = (result: boolean | null) => {
    if (result === null) return null;
    return result ? (
      <Check className="w-4 h-4 text-green-500" />
    ) : (
      <X className="w-4 h-4 text-red-500" />
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 hover:bg-glass-secondary"
        >
          <Settings className="w-5 h-5 text-foreground-muted hover:text-foreground transition-colors" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-glass-primary backdrop-blur-glass border border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-clash text-foreground">
            API Configuration
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Configure your API keys to enable AI council functionality. Keys are stored locally.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            {/* Murf API Key */}
            <Card className="bg-glass-secondary border-border/50">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="murf-key" className="text-xs font-medium">
                      Murf API Key
                    </Label>
                    <div className="flex items-center space-x-1">
                      {getValidationIcon(validationResults.murf)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility('murf')}
                        className="p-1 h-6 w-6"
                      >
                        {showKeys.murf ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="murf-key"
                    type={showKeys.murf ? "text" : "password"}
                    placeholder="ap2_..."
                    value={murfApiKey}
                    onChange={(e) => setMurfApiKey(e.target.value)}
                    className="bg-background/50 h-8 text-sm"
                  />
                  <p className="text-xs text-foreground-muted">
                    Get from{" "}
                    <a
                      href="https://murf.ai/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-glow-primary hover:underline"
                    >
                      Murf AI
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Assembly AI API Key */}
            <Card className="bg-glass-secondary border-border/50">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="assembly-key" className="text-xs font-medium">
                      Assembly AI API Key
                    </Label>
                    <div className="flex items-center space-x-1">
                      {getValidationIcon(validationResults.assembly)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility('assembly')}
                        className="p-1 h-6 w-6"
                      >
                        {showKeys.assembly ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="assembly-key"
                    type={showKeys.assembly ? "text" : "password"}
                    placeholder="Enter Assembly AI key"
                    value={assemblyApiKey}
                    onChange={(e) => setAssemblyApiKey(e.target.value)}
                    className="bg-background/50 h-8 text-sm"
                  />
                  <p className="text-xs text-foreground-muted">
                    Get from{" "}
                    <a
                      href="https://www.assemblyai.com/app"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-glow-primary hover:underline"
                    >
                      Assembly AI
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Cerebras API Key */}
            <Card className="bg-glass-secondary border-border/50">
              <CardContent className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="cerebras-key" className="text-xs font-medium">
                      Cerebras API Key
                    </Label>
                    <div className="flex items-center space-x-1">
                      {getValidationIcon(validationResults.cerebras)}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleKeyVisibility('cerebras')}
                        className="p-1 h-6 w-6"
                      >
                        {showKeys.cerebras ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <Input
                    id="cerebras-key"
                    type={showKeys.cerebras ? "text" : "password"}
                    placeholder="csk-..."
                    value={cerebrasApiKey}
                    onChange={(e) => setCrebrasApiKey(e.target.value)}
                    className="bg-background/50 h-8 text-sm"
                  />
                  <p className="text-xs text-foreground-muted">
                    Get from{" "}
                    <a
                      href="https://cloud.cerebras.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-glow-primary hover:underline"
                    >
                      Cerebras Cloud
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="bg-glass-secondary border-border hover:bg-glass-primary h-8 px-3 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAndTest}
              disabled={isValidating || !murfApiKey.trim() || !assemblyApiKey.trim() || !cerebrasApiKey.trim()}
              className="bg-glow-primary hover:bg-glow-primary/90 text-background h-8 px-3 text-sm"
            >
              {isValidating ? "Testing..." : "Save & Test"}
            </Button>
          </div>

          {validationResults.murf !== null && (
            <div className="space-y-2">
              {Object.values(validationResults).every(result => result === true) ? (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <Check className="h-4 w-4 text-green-500" />
                  <AlertDescription className="text-green-700 text-xs">
                    All API keys are valid! You can now use the AI council.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <X className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700 text-xs">
                    Some API keys failed validation. Please check your keys and try again.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
