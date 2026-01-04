# Como Criar um Atalho na Área de Trabalho

## Passos para Instalação

### 1. Tornar o script executável

Primeiro, dê permissão de execução ao script de inicialização:

```bash
chmod +x /home/claudio/projetos/financial-app-dashboard/start-app.sh
```

### 2. Configurar o arquivo .desktop

O arquivo `financial-dashboard.desktop` já foi criado. Você tem duas opções:

#### Opção A: Atalho na Área de Trabalho

Copie o arquivo para a área de trabalho:

```bash
cp /home/claudio/projetos/financial-app-dashboard/financial-dashboard.desktop ~/Desktop/
chmod +x ~/Desktop/financial-dashboard.desktop
```

Se usar GNOME, pode ser necessário permitir execução de arquivos .desktop:
```bash
gio set ~/Desktop/financial-dashboard.desktop metadata::trusted true
```

#### Opção B: Adicionar ao Menu de Aplicativos

Para adicionar ao menu de aplicativos do sistema:

```bash
mkdir -p ~/.local/share/applications
cp /home/claudio/projetos/financial-app-dashboard/financial-dashboard.desktop ~/.local/share/applications/
chmod +x ~/.local/share/applications/financial-dashboard.desktop
```

### 3. (Opcional) Adicionar um Ícone

O arquivo .desktop está configurado para usar um ícone em:
```
/home/claudio/projetos/financial-app-dashboard/icon.png
```

Você pode:
- Criar ou baixar um ícone e salvá-lo com esse nome
- Ou editar o arquivo `financial-dashboard.desktop` e remover ou alterar a linha `Icon=`

### 4. Testar

Depois de configurar, você pode:

- **Clicar duas vezes** no ícone da área de trabalho, ou
- **Buscar** "Financial Dashboard" no menu de aplicativos do sistema

O terminal abrirá automaticamente e a aplicação será iniciada.

## Usando a Aplicação

Após iniciar:
- O **backend** estará rodando em: `http://localhost:3001`
- O **frontend** estará rodando em: `http://localhost:5173`
- O navegador deve abrir automaticamente

Para parar a aplicação, pressione `Ctrl+C` no terminal.

## Iniciar Manualmente

Se preferir iniciar manualmente sem o atalho, você pode usar:

```bash
cd /home/claudio/projetos/financial-app-dashboard
./start-app.sh
```

Ou usar o comando npm diretamente:

```bash
cd /home/claudio/projetos/financial-app-dashboard
npm run dev
```

## Solução de Problemas

### O atalho não funciona
- Verifique se o script tem permissão de execução: `ls -l start-app.sh`
- Verifique se o caminho no arquivo .desktop está correto

### Dependências não instaladas
Execute manualmente:
```bash
cd /home/claudio/projetos/financial-app-dashboard
npm install
```

### Terminal não abre
Edite o arquivo `financial-dashboard.desktop` e troque `gnome-terminal` por:
- `xterm` se usar Xterm
- `konsole` se usar KDE
- `xfce4-terminal` se usar XFCE
