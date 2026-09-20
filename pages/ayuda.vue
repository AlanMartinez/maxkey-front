<script setup lang="ts">
useHead({
  title: 'Preguntas frecuentes · CHEKEYS',
  meta: [{ name: 'description', content: 'Respuestas sobre pagos, entrega de claves, activación, cuenta y soporte en CHEKEYS.' }],
})

const groups = [
  {
    id: 'compras',
    title: 'Compras y pagos',
    items: [
      {
        q: '¿Qué medios de pago aceptan?',
        a: 'Todos los que ofrece Mercado Pago: tarjetas de crédito y débito, dinero en cuenta y transferencia. El pago se realiza en la plataforma de Mercado Pago; CHEKEYS no recibe ni almacena datos de tarjetas.',
      },
      {
        q: '¿Los precios incluyen impuestos?',
        a: 'Sí. Los precios están expresados en pesos argentinos (ARS) e incluyen los impuestos aplicables. El importe que ves en el producto es el que pagás.',
      },
      {
        q: '¿Necesito una cuenta para comprar?',
        a: 'Sí. Iniciás sesión con tu cuenta de Google en un paso; así las claves quedan asociadas a tu cuenta y podés volver a consultarlas desde “Mis compras” cuando quieras.',
      },
      {
        q: 'Pagué pero la orden sigue pendiente. ¿Qué hago?',
        a: 'Algunos medios (por ejemplo transferencia) demoran unos minutos en acreditarse. Si pasaron más de 30 minutos y la orden no cambia de estado, escribinos con el número de orden y lo revisamos.',
      },
    ],
  },
  {
    id: 'entrega',
    title: 'Entrega y activación',
    items: [
      {
        q: '¿Cuándo recibo mi clave?',
        a: 'Apenas Mercado Pago confirma el pago. La clave aparece en “Mis compras” y te enviamos un aviso por email. En la mayoría de los casos es inmediato.',
      },
      {
        q: '¿Cómo activo el código?',
        a: 'Cada producto incluye instrucciones de canje para su plataforma (Steam, PlayStation, Xbox, Riot, etc.). Seguí los pasos indicados en la página del producto o en el detalle de tu compra.',
      },
      {
        q: '¿Qué significa la región de un producto?',
        a: 'Algunas claves solo pueden canjearse en cuentas de determinada región. Antes de comprar verificá que la región indicada coincida con la de tu cuenta en la plataforma; las claves reveladas con región incompatible no se reembolsan.',
      },
      {
        q: 'La clave no funciona. ¿Qué hago?',
        a: 'Primero revisá que la estés ingresando en la plataforma y región correctas. Si el problema persiste, contactanos con el número de orden y una captura del error; verificamos la clave con nuestro proveedor y te damos una solución.',
      },
    ],
  },
  {
    id: 'cuenta',
    title: 'Cuenta y soporte',
    items: [
      {
        q: '¿Dónde veo mis compras anteriores?',
        a: 'En la sección “Mis compras”, disponible desde el menú de tu cuenta. Ahí encontrás cada orden con su estado y las claves entregadas.',
      },
      {
        q: '¿Puedo pedir un reembolso?',
        a: 'Sí, cuando la clave no fue entregada o resultó inválida y todavía no fue revelada. Los detalles están en nuestra Política de reembolsos.',
      },
      {
        q: '¿Qué datos personales guardan?',
        a: 'Solo los necesarios para operar: nombre y email de tu cuenta de Google, historial de órdenes y datos técnicos mínimos. Podés leer el detalle en la Política de privacidad.',
      },
      {
        q: '¿Cómo me comunico con soporte?',
        a: 'Por email o WhatsApp, en horario comercial. Incluí siempre el número de orden para que podamos ayudarte más rápido.',
      },
    ],
  },
]
</script>

<template>
  <section class="flex flex-col gap-12">
    <header class="max-w-2xl">
      <p class="text-xs font-semibold uppercase tracking-wider text-accent">Centro de ayuda</p>
      <h1 class="mt-2 text-3xl font-bold sm:text-4xl">Preguntas frecuentes</h1>
      <p class="mt-4 text-base leading-relaxed text-white/60">
        Todo lo que necesitás saber sobre pagos, entrega y activación de tus claves.
      </p>
    </header>

    <div class="grid gap-10 lg:grid-cols-[14rem_1fr]">
      <nav class="hidden lg:block" aria-label="Temas">
        <ol class="sticky top-24 flex flex-col gap-2 border-l border-white/10 text-sm">
          <li v-for="group in groups" :key="group.title">
            <a :href="`#${group.id}`" class="-ml-px block border-l border-transparent pl-4 text-white/50 transition hover:border-accent hover:text-white">{{ group.title }}</a>
          </li>
        </ol>
      </nav>

      <div class="flex max-w-3xl flex-col gap-10">
        <section v-for="group in groups" :id="group.id" :key="group.id" class="scroll-mt-24">
          <h2 class="text-xl font-semibold text-white/90">{{ group.title }}</h2>
          <div class="mt-4 flex flex-col gap-3">
            <details v-for="item in group.items" :key="item.q" class="glass group rounded-xl">
              <summary class="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-white/90 [&::-webkit-details-marker]:hidden">
                {{ item.q }}
                <svg class="h-4 w-4 shrink-0 text-white/40 transition group-open:rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <p class="border-t border-white/10 px-5 py-4 leading-relaxed text-white/60">{{ item.a }}</p>
            </details>
          </div>
        </section>

        <div class="glass flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 class="text-xl font-semibold text-white/90">¿Seguís con dudas?</h2>
            <p class="mt-1 text-white/60">Escribinos y te respondemos en horario comercial.</p>
          </div>
          <NuxtLink to="/contacto">
            <AppButton variant="ghost" size="lg">Ir a contacto</AppButton>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
