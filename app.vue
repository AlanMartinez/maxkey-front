<template>
  <div class="flex min-h-screen flex-col">
    <AppHeader />
    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <NuxtPage />
    </main>
    <AppFooter />
    <!-- <CartDrawer /> is added in the cart slice (PR15). -->
    <!-- <LoginDialog /> is added in the auth slice (PR17). -->
  </div>
</template>
