"use client"

import { useState, useEffect } from "react"
import { X, MessageSquare, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { generateAIContent } from "@/lib/ai-content"

interface AIContentModalProps {
  isOpen: boolean
  onClose: () => void
  topic: string
  description?: string
}

export default function AIContentModal({ isOpen, onClose, topic, description }: AIContentModalProps) {
  const [content, setContent] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [userQuestion, setUserQuestion] = useState<string>("")
  const [chatHistory, setChatHistory] = useState<Array<{ role: "user" | "ai"; content: string }>>([])

  useEffect(() => {
    if (isOpen && topic) {
      setIsLoading(true)
      generateAIContent(topic)
        .then((generatedContent) => {
          setContent(generatedContent)
          setIsLoading(false)
        })
        .catch((error) => {
          console.error("Error generating content:", error)
          setContent("ขออภัย เกิดข้อผิดพลาดในการสร้างเนื้อหา กรุณาลองอีกครั้ง")
          setIsLoading(false)
        })
    } else if (!topic && isOpen) {
      setContent("ไม่พบข้อมูลหัวข้อ")
      setIsLoading(false)
    } else {
      // Reset state when modal closes
      setContent("")
      setUserQuestion("")
      setChatHistory([])
    }
  }, [isOpen, topic])

  const handleSubmitQuestion = async () => {
    if (!userQuestion.trim()) return

    // Add user question to chat history
    setChatHistory((prev) => [...prev, { role: "user", content: userQuestion }])

    // Clear input
    setUserQuestion("")

    // Simulate AI thinking
    setTimeout(() => {
      // Generate a simple response based on the question
      const aiResponse = generateSimpleResponse(userQuestion, topic)

      // Add AI response to chat history
      setChatHistory((prev) => [...prev, { role: "ai", content: aiResponse }])
    }, 1000)
  }

  // Simple function to generate responses
  const generateSimpleResponse = (question: string, topic: string): string => {
    const questionLower = question.toLowerCase()
    const topicLower = topic.toLowerCase()

    if (questionLower.includes("อธิบาย") || questionLower.includes("คืออะไร") || questionLower.includes("what is")) {
      return `${topic} คือแนวคิดสำคัญที่เกี่ยวข้องกับ${getRandomTopic(topicLower)}. ในบริบทของ${getRandomContext(topicLower)}, ${topic}มีบทบาทสำคัญในการพัฒนาและขับเคลื่อนความก้าวหน้าในหลายด้าน.`
    } else if (
      questionLower.includes("ประโยชน์") ||
      questionLower.includes("ข้อดี") ||
      questionLower.includes("benefit")
    ) {
      return `ประโยชน์ของ${topic}มีหลายประการ เช่น 1) ช่วยเพิ่มประสิทธิภาพใน${getRandomActivity(topicLower)} 2) ส่งเสริมการพัฒนาด้าน${getRandomDevelopment(topicLower)} 3) สร้างโอกาสใหม่ๆ ใน${getRandomOpportunity(topicLower)} และ 4) ช่วยแก้ปัญหาที่ซับซ้อนใน${getRandomProblem(topicLower)}`
    } else if (
      questionLower.includes("ข้อเสีย") ||
      questionLower.includes("ปัญหา") ||
      questionLower.includes("challenge")
    ) {
      return `ความท้าทายและข้อจำกัดของ${topic}ที่ต้องพิจารณา ได้แก่ 1) ปัญหาด้าน${getRandomIssue(topicLower)} 2) ข้อจำกัดในแง่ของ${getRandomLimitation(topicLower)} 3) ผลกระทบต่อ${getRandomImpact(topicLower)} และ 4) ความเสี่ยงด้าน${getRandomRisk(topicLower)}`
    } else if (
      questionLower.includes("อนาคต") ||
      questionLower.includes("แนวโน้ม") ||
      questionLower.includes("future") ||
      questionLower.includes("trend")
    ) {
      return `แนวโน้มในอนาคตของ${topic}มีความน่าสนใจ โดยคาดว่าจะมีการพัฒนาในด้าน${getRandomFuture(topicLower)} การบูรณาการกับ${getRandomIntegration(topicLower)} และการประยุกต์ใช้ในบริบทของ${getRandomApplication(topicLower)} นอกจากนี้ ยังมีโอกาสในการสร้างนวัตกรรมใหม่ๆ ที่จะเปลี่ยนแปลงวิธีที่เราเข้าใจและใช้งาน${topic}ในอนาคต`
    } else {
      return `คำถามของคุณเกี่ยวกับ${topic}เป็นประเด็นที่น่าสนใจ ในมุมมองทั่วไป ${topic}มีความสำคัญในหลายมิติ ทั้งในแง่ของ${getRandomAspect(topicLower)} การพัฒนา${getRandomDevelopment(topicLower)} และผลกระทบต่อ${getRandomImpact(topicLower)} หากต้องการข้อมูลเฉพาะเจาะจงมากขึ้น สามารถถามคำถามที่ชัดเจนได้`
    }
  }

  // Helper functions to generate random content elements
  const getRandomTopic = (topic: string) => {
    const topics = ["การพัฒนามนุษย์", "เทคโนโลยีสมัยใหม่", "การเปลี่ยนแปลงทางสังคม", "นวัตกรรม", "การศึกษา"]
    return topics[Math.floor(Math.random() * topics.length)]
  }

  const getRandomContext = (topic: string) => {
    const contexts = ["โลกปัจจุบัน", "สังคมไทย", "การพัฒนาที่ยั่งยืน", "การศึกษา", "เศรษฐกิจดิจิทัล"]
    return contexts[Math.floor(Math.random() * contexts.length)]
  }

  const getRandomActivity = (topic: string) => {
    const activities = ["การทำงาน", "การเรียนรู้", "การสื่อสาร", "การแก้ปัญหา", "การตัดสินใจ"]
    return activities[Math.floor(Math.random() * activities.length)]
  }

  const getRandomDevelopment = (topic: string) => {
    const developments = ["ความคิดสร้างสรรค์", "ทักษะการคิดวิเคราะห์", "การเรียนรู้ตลอดชีวิต", "นวัตกรรม", "การพัฒนาที่ยั่งยืน"]
    return developments[Math.floor(Math.random() * developments.length)]
  }

  const getRandomOpportunity = (topic: string) => {
    const opportunities = ["การศึกษา", "การทำงาน", "การพัฒนาตนเอง", "การสร้างธุรกิจ", "การแก้ปัญหาสังคม"]
    return opportunities[Math.floor(Math.random() * opportunities.length)]
  }

  const getRandomProblem = (topic: string) => {
    const problems = ["สังคม", "สิ่งแวดล้อม", "เศรษฐกิจ", "การศึกษา", "สาธารณสุข"]
    return problems[Math.floor(Math.random() * problems.length)]
  }

  const getRandomIssue = (topic: string) => {
    const issues = ["ความเหลื่อมล้ำ", "การเข้าถึง", "ความปลอดภัย", "ความเป็นส่วนตัว", "จริยธรรม"]
    return issues[Math.floor(Math.random() * issues.length)]
  }

  const getRandomLimitation = (topic: string) => {
    const limitations = ["ทรัพยากร", "เทคโนโลยี", "ความรู้ความเข้าใจ", "นโยบายและกฎระเบียบ", "การยอมรับทางสังคม"]
    return limitations[Math.floor(Math.random() * limitations.length)]
  }

  const getRandomImpact = (topic: string) => {
    const impacts = ["สังคม", "เศรษฐกิจ", "สิ่งแวดล้อม", "วัฒนธรรม", "คุณภาพชีวิต"]
    return impacts[Math.floor(Math.random() * impacts.length)]
  }

  const getRandomRisk = (topic: string) => {
    const risks = ["ความปลอดภัย", "ความเป็นส่วนตัว", "การพึ่งพาเทคโนโลยีมากเกินไป", "ผลกระทบทางสังคม", "ความยั่งยืน"]
    return risks[Math.floor(Math.random() * risks.length)]
  }

  const getRandomFuture = (topic: string) => {
    const futures = ["ปัญญาประดิษฐ์", "ความยั่งยืน", "การบูรณาการข้ามศาสตร์", "เทคโนโลยีชีวภาพ", "การเรียนรู้ตลอดชีวิต"]
    return futures[Math.floor(Math.random() * futures.length)]
  }

  const getRandomIntegration = (topic: string) => {
    const integrations = ["เทคโนโลยีดิจิทัล", "วิทยาศาสตร์ข้อมูล", "ชีวิตประจำวัน", "การศึกษา", "การดูแลสุขภาพ"]
    return integrations[Math.floor(Math.random() * integrations.length)]
  }

  const getRandomApplication = (topic: string) => {
    const applications = ["การพัฒนาที่ยั่งยืน", "เมืองอัจฉริยะ", "การศึกษาแห่งอนาคต", "การดูแลสุขภาพเชิงป้องกัน", "เศรษฐกิจหมุนเวียน"]
    return applications[Math.floor(Math.random() * applications.length)]
  }

  const getRandomAspect = (topic: string) => {
    const aspects = ["สังคม", "เศรษฐกิจ", "วัฒนธรรม", "การศึกษา", "เทคโนโลยี"]
    return aspects[Math.floor(Math.random() * aspects.length)]
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className="bg-[#0a1f38] border border-white/10 rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">{topic}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mb-2" />
              <p className="text-white/70">กำลังสร้างเนื้อหา...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Main content */}
              <div className="bg-white/5 rounded-lg p-4">
                <h3 className="text-md font-medium text-cyan-400 mb-2">เกี่ยวกับ {topic}</h3>
                <div className="text-white/90 text-sm space-y-2">
                  {content && content.split("\n\n").map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                </div>
                {description && (
                  <div className="mt-4 text-white/70 text-xs italic">
                    <p>{description}</p>
                  </div>
                )}
              </div>

              {/* Chat history */}
              {chatHistory.length > 0 && (
                <div className="space-y-4 mt-4">
                  <h3 className="text-md font-medium text-purple-400">การสนทนา</h3>
                  <div className="space-y-3">
                    {chatHistory.map((message, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          message.role === "user" ? "bg-purple-500/20 ml-8" : "bg-cyan-500/20 mr-8"
                        }`}
                      >
                        <p className="text-sm text-white/90">{message.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <Input
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              placeholder="ถามคำถามเกี่ยวกับหัวข้อนี้..."
              className="bg-white/10 border-white/10 text-white placeholder:text-white/50"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmitQuestion()
                }
              }}
            />
            <Button
              onClick={handleSubmitQuestion}
              disabled={!userQuestion.trim() || isLoading}
              className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
