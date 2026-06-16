import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/lib/supabase';
import { Upload, Loader2, X } from 'lucide-react';

const categories = [
  { value: 'musica', label: 'Música' },
  { value: 'podcast', label: 'Podcast' },
  { value: 'humor', label: 'Humor' },
  { value: 'noticias', label: 'Notícias' },
  { value: 'educacao', label: 'Educação' },
  { value: 'outros', label: 'Outros' },
];

// Função auxiliar para detectar duração de áudio
const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(Math.round(audio.duration));
    };

    audio.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Erro ao carregar áudio'));
    };
  });
};

export function PublishPost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioPreview, setAudioPreview] = useState<string>('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'musica',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.addToast('error', 'Por favor selecione um arquivo de áudio válido');
        return;
      }

      if (file.size > 50 * 1024 * 1024) {
        toast.addToast('error', 'O arquivo deve ter no máximo 50MB');
        return;
      }

      setAudioFile(file);
      setAudioPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!audioFile) {
      toast.addToast('error', 'Selecione um arquivo de áudio');
      return;
    }

    if (!form.title.trim()) {
      toast.addToast('error', 'Adicione um título');
      return;
    }

    setIsLoading(true);

    try {
      // Faz upload do áudio
      const fileExt = audioFile.name.split('.').pop();
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      console.log('Iniciando upload:', { fileName, fileSize: audioFile.size });

      const { data, error: uploadError } = await supabase.storage
        .from('audios')
        .upload(fileName, audioFile);

      if (uploadError) {
        console.error('Erro detalhado do upload:', uploadError);
        throw new Error(`Upload falhou: ${uploadError.message}`);
      }

      console.log('Upload sucesso:', data);

      // Pega URL pública do arquivo
      const { data: { publicUrl } } = supabase.storage
        .from('audios')
        .getPublicUrl(fileName);

      console.log('URL pública gerada:', publicUrl);

      // Detecta duração
      const duration = await getAudioDuration(audioFile);

      // Salva o post
      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user?.id,
        title: form.title,
        description: form.description,
        category: form.category,
        audio_url: publicUrl,
        duration_seconds: duration,
        visibility: 'public',
      });

      if (insertError) throw insertError;

      toast.addToast('success', 'Áudio publicado com sucesso!');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao publicar áudio';
      console.error('Erro:', err);
      toast.addToast('error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-4xl font-bold text-foreground mb-2">Publicar Áudio</h1>
        <p className="text-muted-foreground mb-8">Compartilhe seu áudio com a comunidade VozZap</p>

        <div className="bg-card rounded-3xl border border-border p-8 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Seção de Upload */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Arquivo de Áudio</label>
              {audioPreview ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-gradient-to-r from-[#25D366]/10 to-[#128C7E]/10 rounded-2xl p-4 border border-[#25D366]/20">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{audioFile?.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(audioFile!.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAudioFile(null);
                        setAudioPreview('');
                      }}
                      className="p-2.5 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors ml-4"
                      title="Remover arquivo"
                    >
                      <X size={20} className="text-red-500" />
                    </button>
                  </div>
                  {audioPreview && (
                    <div className="bg-black/50 rounded-2xl p-4 backdrop-blur-sm">
                      <audio
                        src={audioPreview}
                        controls
                        className="w-full"
                        controlsList="nodownload"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <label className="block border-2 border-dashed border-[#25D366]/40 rounded-2xl p-12 text-center hover:border-[#25D366] hover:bg-[#25D366]/5 transition-all cursor-pointer group">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 bg-[#25D366]/10 rounded-full group-hover:bg-[#25D366]/20 transition-colors">
                      <Upload className="text-[#25D366]" size={32} />
                    </div>
                    <div>
                      <p className="text-foreground font-semibold text-lg">
                        Clique para selecionar ou arraste um arquivo
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        MP3, WAV, OGG ou M4A (máx 50MB)
                      </p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleAudioSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Seção de Metadados */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Título</label>
              <Input
                name="title"
                placeholder="Dê um título ao seu áudio"
                value={form.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Descrição</label>
              <Textarea
                name="description"
                placeholder="Descreva sobre o que é seu áudio (opcional)"
                value={form.description}
                onChange={handleChange}
                rows={5}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-foreground">Categoria</label>
              <Select
                name="category"
                value={form.category}
                onChange={handleChange}
                options={categories}
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !audioFile || !form.title.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1db954]"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Publicando...</span>
                  </>
                ) : (
                  <span>Publicar Áudio</span>
                )}
              </Button>
            </div>
          </form>
        </div>

        {/* Dica de Uso */}
        <div className="mt-8 p-4 bg-[#25D366]/10 rounded-2xl border border-[#25D366]/20">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Dica:</strong> Escolha um título descritivo e uma categoria apropriada para que sua comunidade encontre seu conteúdo mais facilmente.
          </p>
        </div>
      </div>
    </Layout>
  );
}
