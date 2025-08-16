import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            StayCool CRM
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Moderne CRM voor HVAC bedrijven
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <Link
            href="/auth/login"
            className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Inloggen
          </Link>
          
          <Link
            href="/auth/register"
            className="flex w-full justify-center rounded-md bg-white px-4 py-3 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Nieuwe organisatie aanmaken
          </Link>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Lead management • Automatisering • Multi-tenant</p>
        </div>
      </div>
    </div>
  );
}
