export default function AdminLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#050b0d]">
      <div className="flex flex-col items-center gap-4">
        <span
          aria-hidden="true"
          className="h-11 w-11 animate-spin rounded-full border-[3px] border-white/15 border-t-nahda-olive"
        />
        <p className="text-sm font-black uppercase tracking-wide text-white/60">
          Chargement...
        </p>
      </div>
    </div>
  );
}
