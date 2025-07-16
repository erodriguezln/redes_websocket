<script>
  import { onMount } from 'svelte';

  let socket;
  let messages = $state([]);
  let input = $state('');
  let username = $state('');
  let tempUserName = $state('');
  let isUsernameSet = $state(false);
  let isConnected = $state(false);
  let isConnecting = $state(false);
  let currentUsers = $state(0);
  let messagesContainer = $state();

  onMount(() => {

  });

  function sendMessage() {
    if (!input.trim() || !socket) return;
    socket.send(JSON.stringify({type: 'chat_message', message: input, username: username}));
    input = '';
  }

  function setUsername() {
    if (tempUserName.trim()) {
      username = tempUserName.trim();
      isUsernameSet = true;
      connectWebSocket();
    }
  }

  function connectWebSocket() {
    isConnecting = true;
    socket = new WebSocket('ws://localhost:8080');

    socket.addEventListener('open', () => {
      console.info('Conectado al servidor WebSocket');
      isConnected = true;
      isConnecting = false;
      socket.send(JSON.stringify({type: 'user_joined', username: username}));
    });

    socket.addEventListener('message', ({data}) => {
      const msg = JSON.parse(data);
      currentUsers = msg.totalUsers || currentUsers;
      messages = [...messages, msg];
    });

    socket.addEventListener('close', () => {
      console.info('Desconectado del servidor WebSocket');
      isConnected = false;
      isConnecting = false;
    });

    socket.addEventListener('error', (error) => {
      console.error('Error en WebSocket:', error);
      isConnected = false;
      isConnecting = false;
    });
  }

  function handleKeyPress(event, action) {
    if (event.key === 'Enter') {
      action();
    }
  }

  function disconnect() {
    if (socket) {
      socket.close();
    }
    isUsernameSet = false;
    username = '';
    tempUserName = '';
    messages = [];
    currentUsers = 0;
  }

</script>


<div class="max-w-4xl mx-auto h-screen flex flex-col bg-gray-50 font-sans">
  <!-- Header -->
  <header
      class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-4 flex justify-between items-center shadow-lg">
    <h1 class="text-xl md:text-2xl font-semibold">💬 Chat</h1>
    {#if isUsernameSet}
      <div class="flex items-center gap-4 text-sm md:text-base">
        <span class="bg-white/20 px-3 py-1 rounded-full font-medium">
          👤 {username}
        </span>
        <span class="font-medium">
          🟢 {currentUsers} usuarios
        </span>
        <button
            onclick={disconnect}
            class="bg-white/20 hover:bg-white/30 border border-white/30 px-3 py-1 rounded text-sm transition-colors"
        >
          Desconectar
        </button>
      </div>
    {/if}
  </header>

  {#if !isUsernameSet}
    <!-- Username Setup -->
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="bg-white p-8 rounded-xl shadow-xl max-w-md w-full">
        <h2 class="text-2xl font-semibold text-gray-900 mb-2 text-center">
          Únete al chat
        </h2>
        <p class="text-gray-600 mb-6 text-center">
          Ingresa tu nombre de usuario para comenzar
        </p>
        <div class="flex gap-3">
          <input
              bind:value={tempUserName}
              onkeypress={(e) => handleKeyPress(e, setUsername)}
              placeholder="Tu nombre de usuario"
              class="username-input flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              maxlength="20"
          />
          <button
              onclick={setUsername}
              disabled={!tempUserName.trim()}
              class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            Unirse
          </button>
        </div>
      </div>
    </div>
  {:else}
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Connection Status -->
      <div class="bg-gray-100 px-4 py-2 border-b border-gray-200 text-center">
        {#if isConnecting}
          <span class="text-amber-600 font-medium text-sm">🔄 Conectando...</span>
        {:else if isConnected}
          <span class="text-green-600 font-medium text-sm">🟢 Conectado</span>
        {:else}
          <span class="text-red-600 font-medium text-sm">🔴 Desconectado</span>
        {/if}
      </div>

      <!-- Messages -->
      <div
          bind:this={messagesContainer}
          class="flex-1 overflow-y-auto p-4 bg-white space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {#each messages as {type, message, timestamp, username}, i (i)}
          <div class="flex {type === 'message' ? 'justify-end' : 'justify-start'}">
            <div class="max-w-xs md:max-w-md lg:max-w-lg">
              {#if type === 'message'}
                <!-- User Message -->
                <div class="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-lg">
                  <div class="flex justify-between items-center mb-1 text-xs text-gray-500">
                    <span class="font-semibold text-gray-700">{username}</span>
                    <span>{new Date(timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div class="text-gray-800 leading-relaxed break-words">
                    {message}
                  </div>
                </div>
              {:else}
                <!-- System Message -->
                <div class="bg-gray-50 border-l-4 border-gray-400 p-3 rounded-lg">
                  <div class="flex justify-between items-center mb-1 text-xs text-gray-500">
                    <span class="font-semibold">Sistema</span>
                    <span>{new Date(timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div class="text-gray-600 italic leading-relaxed">
                    {message}
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/each}

        {#if messages.length === 0}
          <div class="text-center text-gray-500 italic mt-8">
            <div class="text-4xl mb-2">💬</div>
            <p>No hay mensajes aún. ¡Sé el primero en escribir!</p>
          </div>
        {/if}
      </div>

      <!-- Message Input -->
      <div class="p-4 bg-white border-t border-gray-200">
        <div class="flex gap-3">
          <input
              bind:value={input}
              onkeypress={(e) => handleKeyPress(e, sendMessage)}
              placeholder="Escribe tu mensaje..."
              class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              disabled={!isConnected}
              maxlength="500"
          />
          <button
              onclick={sendMessage}
              disabled={!input.trim() || !isConnected}
              class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed whitespace-nowrap"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

