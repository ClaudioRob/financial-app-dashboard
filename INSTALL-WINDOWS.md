# Como Criar Atalho no Windows (WSL2)

Como você está usando WSL2, o atalho deve ser criado no Desktop do **Windows**, não do Linux.

## Opção 1: Criar Atalho Manualmente (RECOMENDADO)

### Passo 1: Localizar o arquivo .bat
1. Abra o Explorador de Arquivos do Windows
2. Na barra de endereços, digite: `\\wsl$\Ubuntu\home\claudio\projetos\financial-app-dashboard`
3. Você verá o arquivo `start-financial-dashboard.bat`

### Passo 2: Criar o atalho
1. Clique com botão direito no arquivo `start-financial-dashboard.bat`
2. Selecione "Criar atalho"
3. Arraste o atalho para a Área de Trabalho do Windows

### Passo 3: (Opcional) Personalizar o ícone
1. Clique com botão direito no atalho na área de trabalho
2. Selecione "Propriedades"
3. Clique em "Alterar ícone..."
4. Escolha um ícone de sua preferência

Pronto! Agora você pode clicar duas vezes no atalho para iniciar a aplicação.

---

## Opção 2: Comando Direto no Atalho

Você também pode criar um atalho manualmente no Windows:

1. **Clique com botão direito** na Área de Trabalho do Windows
2. Selecione **Novo > Atalho**
3. Cole este comando no campo de localização:
   ```
   wsl -d Ubuntu -- bash -c "cd /home/claudio/projetos/financial-app-dashboard && ./start-app.sh"
   ```
4. Clique em **Avançar**
5. Digite o nome: **Financial Dashboard**
6. Clique em **Concluir**

---

## Opção 3: Windows Terminal (Mais Elegante)

Se você tem o Windows Terminal instalado:

1. **Clique com botão direito** na Área de Trabalho do Windows
2. Selecione **Novo > Atalho**
3. Cole este comando:
   ```
   wt.exe -w 0 wsl -d Ubuntu -- bash -c "cd /home/claudio/projetos/financial-app-dashboard && ./start-app.sh; exec bash"
   ```
4. Nomeie como **Financial Dashboard**
5. Clique em **Concluir**

---

## Opção 4: Copiar o .bat para o Windows

Você pode copiar o arquivo .bat diretamente para o Desktop do Windows:

1. No terminal WSL, execute:
   ```bash
   cp /home/claudio/projetos/financial-app-dashboard/start-financial-dashboard.bat /mnt/c/Users/$USER/Desktop/
   ```
   
   (Substitua `$USER` pelo seu nome de usuário do Windows se necessário)

2. O arquivo aparecerá na área de trabalho do Windows

---

## Como Usar

Depois de criar o atalho:
1. **Clique duas vezes** no atalho
2. Um terminal abrirá
3. A aplicação será iniciada automaticamente
4. O **backend** rodará em: `http://localhost:3001`
5. O **frontend** rodará em: `http://localhost:5173`
6. Seu navegador deve abrir automaticamente

Para parar a aplicação, pressione `Ctrl+C` no terminal.

---

## Notas Importantes

- **Nome da Distribuição WSL**: O script usa `Ubuntu` como nome da distribuição. Se sua distribuição WSL tem outro nome (como `Ubuntu-20.04` ou `Debian`), você precisa ajustar isso no comando.

- **Para verificar o nome da sua distribuição WSL**, execute no PowerShell ou CMD:
  ```powershell
  wsl -l -v
  ```

- **Se o nome for diferente**, edite o arquivo `start-financial-dashboard.bat` e substitua `Ubuntu` pelo nome correto.

---

## Solução de Problemas

### O comando wsl não é reconhecido
- Certifique-se de que o WSL2 está instalado e configurado corretamente
- Tente reiniciar o computador

### A aplicação não inicia
- Verifique se as dependências foram instaladas: `npm install`
- Teste executando manualmente no WSL: `./start-app.sh`

### Caminho do Desktop diferente
Se seu usuário Windows tem um nome diferente, o caminho será:
```
/mnt/c/Users/SeuNomeDeUsuario/Desktop/
```
