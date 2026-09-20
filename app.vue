<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />
    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
      <NuxtPage />
    </main>
    <AppFooter />
    <CartDrawer />
    <LoginDialog />
    <AppToast />
  </div>
</template>
