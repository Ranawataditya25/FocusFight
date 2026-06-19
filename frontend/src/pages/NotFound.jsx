import { Link } from 'react-router-dom';

const NotFound = () => (
  <div className="mx-auto max-w-xl rounded-3xl border border-slate-800 bg-slate-900/90 p-12 text-center shadow-soft">
    <p className="text-sm uppercase tracking-[0.2em] text-slate-500">404</p>
    <h1 className="mt-4 text-4xl font-semibold text-white">Page not found</h1>
    <p className="mt-3 text-slate-400">The path you are looking for is not part of the FocusFight challenge flow.</p>
    <Link className="mt-8 inline-flex rounded-3xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-400" to="/">
      Return home
    </Link>
  </div>
);

export default NotFound;
