import Image from "next/image"
import { SearchBar } from "@/components/search-bar"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 bg-[#081a2f] text-white">
      <div className="w-full max-w-5xl flex flex-col items-center justify-center min-h-screen">
        <div className="flex flex-col items-center justify-center gap-6 sm:gap-8 w-full">
          <div className="relative w-48 h-48 sm:w-80 sm:h-80 mb-2 sm:mb-4">
            <Image src="/logo.png" alt="AIMap Logo" fill priority className="object-contain" />
          </div>

          <div className="w-full max-w-md px-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-3 sm:mb-4 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
              ค้นพบข้อมูลเชิงลึกด้วย AI
            </h1>

            <p className="text-center text-gray-300 mb-6 sm:mb-8 text-sm sm:text-base">
              สร้างแผนผังความคิดแบบไดนามิกเพื่อจัดระเบียบข้อมูลที่ซับซ้อนได้อย่างง่ายดาย
            </p>

            <SearchBar />

            <div className="mt-3 sm:mt-4 text-center text-xs sm:text-sm text-gray-400">
              <p>ป้อนหัวข้อ คำถาม หรือคำสำคัญเพื่อสร้างแผนผังความคิดด้วย AI</p>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full max-w-2xl">
            {[
              {
                title: "ใช้งานง่าย",
                description: "ออกแบบให้ใช้งานได้ง่ายทั้งบนมือถือและคอมพิวเตอร์",
              },
              {
                title: "โครงสร้างไดนามิก",
                description: "ปรับเปลี่ยนตามเนื้อหาเพื่อความเข้าใจที่ดีขึ้น",
              },
              {
                title: "ความชัดเจนทางสายตา",
                description: "สีที่แตกต่างกันและการจัดวางที่ชัดเจนเพื่อการนำทางที่ง่ายขึ้น",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-3 sm:p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-500/50 transition-all"
              >
                <h3 className="font-medium text-base sm:text-lg mb-1 sm:mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
