"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Share2, Info } from "lucide-react"
import EnhancedMindMap from "@/components/enhanced-mind-map"
import { Skeleton } from "@/components/ui/skeleton"

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || ""
  const [mindMapData, setMindMapData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTips, setShowTips] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  useEffect(() => {
    async function generateMap() {
      if (!query) return

      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch("/api/generate-map", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ query }),
        })

        if (!response.ok) {
          throw new Error("Failed to generate mind map")
        }

        const result = await response.json()

        try {
          // Parse the JSON string from the API response
          const parsedData = JSON.parse(result.data)
          setMindMapData(parsedData)
        } catch (parseError) {
          console.error("Error parsing mind map data:", parseError)
          setError("Invalid mind map data format")
        }
      } catch (err) {
        console.error("Error generating mind map:", err)
        setError("Failed to generate mind map. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    generateMap()
  }, [query])

  // Function to export the mind map as an image
  const exportAsPNG = () => {
    const svgElement = document.querySelector("svg")
    if (!svgElement) return

    // Create a canvas element
    const canvas = document.createElement("canvas")
    const svgRect = svgElement.getBoundingClientRect()
    canvas.width = svgRect.width
    canvas.height = svgRect.height
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Create an image from the SVG
    const image = new Image()
    const svgData = new XMLSerializer().serializeToString(svgElement)
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(svgBlob)

    image.onload = () => {
      // Draw the image on the canvas
      ctx.fillStyle = "#081a2f"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(image, 0, 0)
      URL.revokeObjectURL(url)

      // Convert canvas to PNG and download
      const link = document.createElement("a")
      link.download = `aimap-${query.replace(/\s+/g, "-").toLowerCase()}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    }

    image.src = url
    image.crossOrigin = "anonymous"
  }

  return (
    <div className="min-h-screen bg-[#081a2f] text-white p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-4">
          <div className="flex items-center">
            <Link href="/">
              <Button variant="ghost" size={isMobile ? "sm" : "default"} className="text-white hover:bg-white/10">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">กลับ</span>
              </Button>
            </Link>
            <h1 className="text-lg sm:text-2xl font-bold ml-2 truncate max-w-[150px] sm:max-w-md">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                {query}
              </span>
            </h1>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white"
              onClick={() => setShowTips(!showTips)}
            >
              <Info size={16} className={isMobile ? "" : "mr-2"} />
              <span className="hidden sm:inline">คำแนะนำ</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white"
              onClick={exportAsPNG}
              disabled={isLoading || !!error}
            >
              <Download size={16} className={isMobile ? "" : "mr-2"} />
              <span className="hidden sm:inline">บันทึก</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                alert("คัดลอกลิงก์แล้ว!")
              }}
            >
              <Share2 size={16} className={isMobile ? "" : "mr-2"} />
              <span className="hidden sm:inline">แชร์</span>
            </Button>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-2 sm:p-4 min-h-[50vh] sm:min-h-[70vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[50vh] sm:h-[70vh]">
              <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent mb-4"></div>
                <p className="text-lg">กำลังสร้างแผนผังความคิด...</p>
                <div className="w-64 mt-4">
                  <Skeleton className="h-4 w-full bg-white/10 mb-2" />
                  <Skeleton className="h-4 w-3/4 bg-white/10 mb-2" />
                  <Skeleton className="h-4 w-5/6 bg-white/10" />
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[50vh] sm:h-[70vh] text-center">
              <p className="text-red-400 text-lg mb-4">{error}</p>
              <Link href="/">
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
                  ลองอีกครั้ง
                </Button>
              </Link>
            </div>
          ) : (
            <EnhancedMindMap data={mindMapData} />
          )}
        </div>

        {showTips && (
          <div className="mt-4 sm:mt-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4">
            <h2 className="text-md sm:text-lg font-medium mb-2 sm:mb-3">คำแนะนำการใช้งาน</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <h3 className="text-sm sm:text-md font-medium text-cyan-400 mb-1 sm:mb-2">การนำทาง</h3>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-300">
                  <li>กดที่กล่องข้อความเพื่อดูรายละเอียดเพิ่มเติม</li>
                  <li>ใช้นิ้วเลื่อนหรือลากเพื่อดูทั้งหมด</li>
                  <li>ใช้ปุ่มซูมเพื่อปรับขนาด</li>
                  <li>กดปุ่มเต็มจอเพื่อขยายแผนผัง</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm sm:text-md font-medium text-purple-400 mb-1 sm:mb-2">ฟีเจอร์ใหม่</h3>
                <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-gray-300">
                  <li>กดที่ไอคอนหนังสือเพื่อดูเนื้อหาเพิ่มเติม</li>
                  <li>ถามคำถามเกี่ยวกับหัวข้อที่สนใจได้</li>
                  <li>กดปุ่มบันทึกเพื่อดาวน์โหลดเป็นรูปภาพ</li>
                  <li>กดปุ่มแชร์เพื่อคัดลอกลิงก์</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
