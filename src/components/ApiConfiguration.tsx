import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface ApiConfigurationProps {
  onConfigurationChange?: (hasValidKeys: boolean) => void;
}

export default function ApiConfiguration({ onConfigurationChange }: ApiConfigurationProps) {
  const [cerebrasKey, setCerebrasKey] = useState('');
  const [murfKey, setMurfKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    // Load existing keys from localStorage
    const savedCerebrasKey = localStorage.getItem('cerebras_api_key') || '';
    const savedMurfKey = localStorage.getItem('murf_api_key') || '';
    
    setCerebrasKey(savedCerebrasKey);
    setMurfKey(savedMurfKey);
    
    const hasKeys = !!(savedCerebrasKey && savedMurfKey);
    setIsConfigured(hasKeys);
    onConfigurationChange?.(hasKeys);
  }, [onConfigurationChange]);

  const handleSaveConfiguration = () => {
    if (cerebrasKey.trim()) {
      localStorage.setItem('cerebras_api_key', cerebrasKey.trim());
    }
    if (murfKey.trim()) {
      localStorage.setItem('murf_api_key', murfKey.trim());
    }
    
    const hasKeys = !!(cerebrasKey.trim() && murfKey.trim());
    setIsConfigured(hasKeys);
    onConfigurationChange?.(hasKeys);
  };

  const maskKey = (key: string) => {
    if (!key) return '';
    if (key.length <= 8) return '*'.repeat(key.length);
    return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isConfigured ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-orange-500" />
          )}
          API Configuration
        </CardTitle>
        <CardDescription>
          Configure your API keys to enable AI Council functionality. Your keys are stored locally in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isConfigured && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              API keys are configured and ready to use!
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cerebras-key">Cerebras API Key</Label>
            <Input
              id="cerebras-key"
              type="password"
              placeholder="Enter your Cerebras API key"
              value={cerebrasKey}
              onChange={(e) => setCerebrasKey(e.target.value)}
            />
            {cerebrasKey && (
              <p className="text-sm text-gray-500">
                Current key: {maskKey(cerebrasKey)}
              </p>
            )}
            <div className="text-sm text-gray-600">
              <a 
                href="https://cloud.cerebras.ai/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
              >
                Get your Cerebras API key <ExternalLink className="w-3 h-3" />
              </a>
              {' '}(Used for AI responses and reasoning)
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="murf-key">Murf API Key</Label>
            <Input
              id="murf-key"
              type="password"
              placeholder="Enter your Murf API key"
              value={murfKey}
              onChange={(e) => setMurfKey(e.target.value)}
            />
            {murfKey && (
              <p className="text-sm text-gray-500">
                Current key: {maskKey(murfKey)}
              </p>
            )}
            <div className="text-sm text-gray-600">
              <a 
                href="https://murf.ai/api" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
              >
                Get your Murf API key <ExternalLink className="w-3 h-3" />
              </a>
              {' '}(Used for text-to-speech voice synthesis)
            </div>
          </div>
        </div>

        <Button 
          onClick={handleSaveConfiguration}
          className="w-full"
          disabled={!cerebrasKey.trim() || !murfKey.trim()}
        >
          Save Configuration
        </Button>

        {!isConfigured && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              Both API keys are required to use the AI Council features. The application will not function without proper configuration.
            </AlertDescription>
          </Alert>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Privacy:</strong> API keys are stored only in your browser's local storage and never sent to external servers except to the respective API providers.</p>
          <p><strong>Security:</strong> Always keep your API keys confidential and never share them publicly.</p>
        </div>
      </CardContent>
    </Card>
  );
}
