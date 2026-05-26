export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-[#f2f2ef] px-0 dark:bg-[#0a0c0a] md:px-4 md:py-4">
      <main className="relative flex min-h-svh w-full max-w-[430px] items-center justify-center overflow-hidden bg-[#fbfbfa] md:min-h-[calc(100svh-2rem)] md:rounded-[2.7rem] md:border md:border-white/70 md:shadow-[0_34px_100px_rgba(20,23,22,0.16)] dark:bg-[#111410] dark:md:border-slate-700/50 dark:md:shadow-[0_34px_100px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(242,228,212,0.92),rgba(251,251,250,0)_38%),linear-gradient(180deg,#fbfbfa_0%,#f5f0e8_52%,#f7faf7_100%)] dark:bg-[radial-gradient(circle_at_50%_28%,rgba(30,20,14,0.85),rgba(17,20,16,0)_38%),linear-gradient(180deg,#111410_0%,#0f1311_52%,#0b0f0d_100%)]" />
        <div className="absolute left-[-5rem] top-[18%] h-56 w-56 rounded-full bg-[#efe0cf]/70 blur-3xl dark:bg-[#2a1e12]/55" />
        <div className="absolute right-[-4.5rem] bottom-[20%] h-56 w-56 rounded-full bg-[#dceee9]/80 blur-3xl dark:bg-[#0d2f26]/55" />
        <div className="absolute bottom-[-5rem] left-1/2 h-52 w-[30rem] -translate-x-1/2 rounded-[50%] bg-[#eef3ee] dark:bg-[#111714]" />

        <div className="relative flex flex-col items-center">
          <div className="grid h-22 w-22 grid-cols-2 overflow-hidden rounded-[1.85rem] shadow-[0_24px_60px_rgba(20,23,22,0.14)]">
            <span className="bg-[#006b5b]" />
            <span className="bg-[#c9ddd2]" />
            <span className="bg-[#eee5d8]" />
            <span className="bg-[#8aa79a]" />
          </div>
          <h1 className="mt-5 font-display text-[2.35rem] font-semibold leading-none tracking-[0.01em] text-[#141716] dark:text-white">
            Fintra
          </h1>
          <div className="mt-7 flex gap-1.5" aria-hidden="true">
            <span className="h-1.5 w-5 animate-pulse rounded-full bg-[#006b5b]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c9ddd2] [animation-delay:160ms]" />
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d8cbbb] [animation-delay:320ms]" />
          </div>
        </div>
      </main>
    </div>
  )
}
