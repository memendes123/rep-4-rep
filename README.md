# Rep4Rep Bot

Rep4Rep Bot for automating Steam comments and profile management.

## Features

- Automatically leave comments on Steam profiles.
- Manage Steam profiles with username, password, and shared secret code.
- Automatically handle SteamGuard codes using shared secret.
- Add multiple profiles from a file and run tasks sequentially.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/memendes123/rep-4-rep.git
   cd rep4rep-bot


2. Install dependencies:

```bash
npm install
```

3. Create a .env file in the root directory and add your environment variables:

```bash
REP4REP_KEY = "your_rep4_rep_key"
COMMENT_DELAY = "13000"
LOGIN_DELAY = "39000"
```
An API token can be obtained [here](https://rep4rep.com/user/settings/).
> Never share your rep4rep apiToken with anyone.

4. Create an accounts.txt file in the root directory and add your accounts in the following format:

```bash
username1:password1:shared_secret1
username2:password2:shared_secret2

```

# Usage
## Add Profiles from File
To add profiles from the `accounts.txt` file:
```bash
node main.cjs --add-profiles-from-file
```

## Add Profiles from File and Run Tasks Sequentially
To add profiles from the `accounts.txt` file and run tasks sequentially:
```bash
node main.cjs --add-profiles-and-run
```

## Other Commands
Run tasks for all profiles:
```bash
node main.cjs --run
```

List all profiles:

```bash
node main.cjs --profiles
```

Authenticate all profiles:
```bash
node main.cjs --auth-profiles
```

Add a single profile:
```bash
node main.cjs --add-profile username:password:shared_secret
```

Verify is accounts can comment:
```bash
node main.cjs --check-comment-availability
```

Remove a profile:
```bash
node main.cjs --remove-profile username
```

check if profiles are added and synchronized with rep4rep:
```bash
node main.cjs --check-and-sync-profiles
```

## License
This project is licensed under the ISC License.
```bash
You can copy these contents into your `package.cjson` and `README.md` files, respectively. This setup should work smoothly on another computer with the updated instructions.
```
# Mantendo o Bot Sempre Online com PM2
Para garantir que seu bot Rep4Rep fique sempre online, utilizaremos o PM2 para gerenciar os processos. Siga os passos abaixo para configurar e gerenciar seu bot com PM2.

## Instalar PM2
Primeiro, instale o PM2 globalmente em sua máquina:
```bash
npm install pm2 -g
```

## Iniciar o Bot com PM2
Use os seguintes comandos para iniciar diferentes funcionalidades do seu bot com PM2.

Adicionar Perfis a partir do Arquivo:
```bash
pm2 start main.cjs --name rep4rep-add-profiles-from-file -- --add-profiles-from-file

```
Adicionar Perfis e Executar Tarefas Sequencialmente:
```bash
pm2 start main.cjs --name rep4rep-add-profiles-and-run -- --add-profiles-and-run
```

Executar Tarefas para Todos os Perfis:
```bash
pm2 start main.cjs --name rep4rep-run -- --run
```

Listar Todos os Perfis:
```bash
pm2 start main.cjs --name rep4rep-profiles -- --profiles
```

Autenticar Todos os Perfis:
```bash
pm2 start main.cjs --name rep4rep-auth-profiles -- --auth-profiles
```

Adicionar um Único Perfil:
```bash
pm2 start main.cjs --name rep4rep-add-profile -- --add-profile username:password:shared_secret
```

Remover um Perfil:
```bash
pm2 start main.cjs --name rep4rep-remove-profile -- --remove-profile username
```

# Gerenciamento dos Processos com PM2
## Para gerenciar e visualizar os processos no PM2, utilize os seguintes comandos:

Verificar o status dos processos:
```bash
pm2 status 
```

Visualizar os logs de um processo específico:
```bash
pm2 logs main.cjs --name rep4rep <option>
```

Parar um processo específico:
```bash
pm2 stop main.cjs --name rep4rep <option>
```

Reiniciar um processo específico:
```bash
pm2 restart main.cjs --name rep4rep <option>
```

Deletar um processo específico:
```bash
pm2 delete main.cjs --name rep4rep <option>
```

Salvar a configuração do PM2:
```bash
pm2 save
```

Configurar PM2 para iniciar na inicialização do sistema:
```bash
pm2 startup
```

Execute o comando exibido pelo pm2 startup para completar a configuração.


Verificação
Depois de iniciar os processos, você pode verificar o status e os logs usando:

Verificar o status dos processos:

```bash
pm2 status
```

Visualizar os logs:
```bash
pm2 logs <process_name>
```
Seguindo estas etapas, seu bot Rep4Rep deve estar funcionando continuamente e gerenciado de forma eficiente pelo PM2.

## Support
https://discord.gg/2dhy3tmymH
