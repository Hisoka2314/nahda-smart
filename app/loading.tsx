export default function RootLoading() {
  return (
    <div className="grid min-h-[60vh] place-items-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <span
          aria-hidden="true"
          className="h-11 w-11 animate-spin rounded-full border-[3px] border-nahda-olive/25 border-t-nahda-olive"
        />
        <p className="text-sm font-black uppercase tracking-wide text-nahda-olive">
          Chargement...
        </p>
      </div>
    </div>
  );
}
