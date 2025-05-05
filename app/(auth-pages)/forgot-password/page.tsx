import { Message } from "@/components/form-message";
import ForgotPasswordForm from "./components/ForgotPasswordForm";
import Image from "next/image";

export default async function ForgotPasswordPage(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  
  return (
    <div className="grid w-9/12 min-h-svh mx-auto border-2 border-red-500 md:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <a href="#" className="flex items-center gap-2 text-enugu font-medium">
          <img src="/logo.jpeg" alt="logo" className="w-10 h-10" />
          Ndi Enugu Scotland.
        </a>
        <div className="flex flex-1 flex-col justify-center gap-4 md:justify-start">
          <div className="w-full max-w-xs">
            <ForgotPasswordForm message={searchParams} />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <Image
          src="https://zuelvssw8o.ufs.sh/f/u9RlmOBa19byWF0AKEowg8traxph0fYqZmI1GH3v9yMFcklb"
          alt="Background"
          className="absolute inset-0 h-full w-full object-contain dark:brightness-[0.2] dark:grayscale"
          width={1000}
          height={1000}
        />
      </div>
    </div>
  );
}
