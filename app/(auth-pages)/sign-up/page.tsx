import { Message } from "@/components/form-message";
import SignUpForm from "./components/SignUpForm";
import Image from "next/image";
export default async function SignUpPage(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  
  return (
    <div className="grid w-9/12 min-h-svh mx-auto md:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <a href="#" className="flex items-center gap-2 text-enugu font-medium">
          <img src="/logo.jpeg" alt="logo" className="w-10 h-10" />
          Ndi Enugu Scotland.
        </a>
        <div className="flex flex-1 flex-col justify-center gap-4 md:justify-start">
          <div className="w-full max-w-xs">
            <SignUpForm message={searchParams} />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <Image
          src="https://zuelvssw8o.ufs.sh/f/u9RlmOBa19by4xEJdviy79wU6301TP5vnVgWFb2DYKqILlZd"
          alt="Background"
          className="absolute inset-0 h-full w-full object-contain dark:brightness-[0.2] dark:grayscale"
          width={1000}
          height={1000}
        />
      </div>
    </div>
  );
}
