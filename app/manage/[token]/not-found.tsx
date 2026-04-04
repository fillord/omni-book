export default function ManageTokenNotFound() {
  return (
    <div className="bg-[var(--neu-bg)] min-h-screen flex items-center justify-center p-4">
      <div className="neu-raised bg-[var(--neu-bg)] rounded-2xl p-8 max-w-sm w-full text-center space-y-5">
        <div className="neu-inset bg-[var(--neu-bg)] rounded-xl p-5 inline-flex items-center justify-center mx-auto w-20 h-20">
          <span className="text-3xl text-muted-foreground">?</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-lg font-semibold text-foreground">Запись не найдена</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ссылка недействительна или запись уже не существует.
            Пожалуйста, обратитесь напрямую к заведению.
          </p>
        </div>
      </div>
    </div>
  )
}
