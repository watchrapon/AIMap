"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { ZoomIn, ZoomOut, RefreshCw, X, Maximize, Minimize, Book, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { generateAIContent } from "@/lib/ai-content"
import { Input } from "@/components/ui/input"

interface MindMapNode {
  topic?: string
  name?: string
  description?: string
  isLeafNode?: boolean
  children: MindMapNode[]
  id?: string
}

interface MindMapProps {
  data: MindMapNode
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export default function MindMap({ data }: MindMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [processedData, setProcessedData] = useState<MindMapNode | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [aiContentNode, setAiContentNode] = useState<string | null>(null)
  const [aiContent, setAiContent] = useState<string | null>(null)
  const [isGeneratingContent, setIsGeneratingContent] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)

  // Process the data to add unique IDs
  useEffect(() => {
    if (!data) return

    const processNode = (node: MindMapNode, path = "root"): MindMapNode => {
      const nodeId = `${path}-${node.name || node.topic || "node"}`

      // Process children recursively
      const processedChildren = node.children.map((child, index) => processNode(child, `${nodeId}-${index}`))

      return {
        ...node,
        id: nodeId,
        children: processedChildren,
      }
    }

    const processed = processNode(data)
    setProcessedData(processed)
  }, [data])

  // Check if device is mobile
  useEffect(() => {
    const checkDevice = () => {
      const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0
      const isSmallScreen = window.innerWidth < 768
      setIsMobile(isTouchDevice || isSmallScreen)
    }

    checkDevice()

    // Add event listeners for resize
    window.addEventListener("resize", checkDevice)

    return () => {
      window.removeEventListener("resize", checkDevice)
    }
  }, [])

  // Handle fullscreen mode
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatContainerRef.current && chatMessages.length > 0) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages])

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`)
        })
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`)
        })
      }
    }
  }

  // Function to reset the view
  const resetView = () => {
    setIsLoading(true)
    setTimeout(() => {
      renderMindMap()
      setZoomLevel(1)
      setIsLoading(false)
    }, 100)
  }

  // Function to zoom in
  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 3))
  }

  // Function to zoom out
  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 0.5))
  }

  // Function to handle node click
  const handleNodeClick = (nodeId: string, event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation()
    setActiveNode(activeNode === nodeId ? null : nodeId)

    // Reset AI content when changing nodes
    if (aiContentNode !== nodeId) {
      setAiContentNode(null)
      setAiContent(null)
      setChatMessages([])
    }
  }

  // Function to handle AI content generation
  const handleGenerateContent = async (nodeId: string, nodeName: string) => {
    if (aiContentNode === nodeId && aiContent) {
      // If already showing content for this node, just toggle the panel
      setAiContentNode(null)
      return
    }

    setAiContentNode(nodeId)
    setIsGeneratingContent(true)
    setChatMessages([])

    try {
      const content = await generateAIContent(nodeName)
      setAiContent(content)

      // Add initial assistant message
      setChatMessages([
        {
          role: "assistant",
          content: `ฉันสามารถให้ข้อมูลเพิ่มเติมเกี่ยวกับ "${nodeName}" ได้ คุณมีคำถามอะไรเกี่ยวกับหัวข้อนี้ไหม?`,
        },
      ])
    } catch (error) {
      console.error("Error generating AI content:", error)
      setAiContent("ไม่สามารถสร้างเนื้อหาได้ กรุณาลองอีกครั้ง")
    } finally {
      setIsGeneratingContent(false)
    }
  }

  // Function to handle chat submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!chatInput.trim() || isChatLoading) return

    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput,
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setIsChatLoading(true)

    try {
      // Get active node name for context
      const activeNodeData = activeNode ? findNodeById(activeNode) : null
      const nodeName = activeNodeData?.name || activeNodeData?.topic || ""

      // Simulate AI response (in a real app, this would call an API)
      setTimeout(() => {
        const aiResponse = generateChatResponse(chatInput, nodeName)
        setChatMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: aiResponse,
          },
        ])
        setIsChatLoading(false)
      }, 1000)
    } catch (error) {
      console.error("Error in chat:", error)
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "ขออภัย เกิดข้อผิดพลาดในการประมวลผลคำถามของคุณ กรุณาลองอีกครั้ง",
        },
      ])
      setIsChatLoading(false)
    }
  }

  // Helper function to calculate text width
  const getTextWidth = (text: string, font: string): number => {
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    if (!context) return 0

    context.font = font
    const metrics = context.measureText(text)
    return metrics.width
  }

  // Find node data by ID
  const findNodeById = (nodeId: string): MindMapNode | null => {
    if (!processedData) return null

    const findNode = (node: MindMapNode): MindMapNode | null => {
      if (node.id === nodeId) return node

      for (const child of node.children) {
        const found = findNode(child)
        if (found) return found
      }

      return null
    }

    return findNode(processedData)
  }

  // Generate a chat response based on the user's question and the node topic
  const generateChatResponse = (question: string, topic: string): string => {
    // In a real application, this would call an AI API
    // For this demo, we'll return predefined responses based on keywords

    const questionLower = question.toLowerCase()

    if (
      questionLower.includes("อธิบาย") ||
      questionLower.includes("คืออะไร") ||
      questionLower.includes("explain") ||
      questionLower.includes("what is")
    ) {
      return `${topic} คือแนวคิดสำคัญที่เกี่ยวข้องกับการจัดระบบข้อมูลและความรู้ในรูปแบบที่เข้าใจง่าย ช่วยให้ผู้ใช้สามารถเห็นความเชื่อมโยงระหว่างแนวคิดต่างๆ ได้อย่างชัดเจน`
    }

    if (
      questionLower.includes("ประโยชน์") ||
      questionLower.includes("ข้อดี") ||
      questionLower.includes("benefits") ||
      questionLower.includes("advantages")
    ) {
      return `ประโยชน์ของ ${topic} มีหลายประการ เช่น ช่วยในการจัดระเบียบความคิด ทำให้เข้าใจเนื้อหาที่ซับซ้อนได้ง่ายขึ้น และช่วยในการจดจำข้อมูลสำคัญได้ดียิ่งขึ้น นอกจากนี้ยังช่วยในการวางแผนและการแก้ปัญหาอย่างเป็นระบบ`
    }

    if (questionLower.includes("ตัวอย่าง") || questionLower.includes("example")) {
      return `ตัวอย่างของ ${topic} ที่พบได้ทั่วไปคือการใช้ในการศึกษา การวางแผนโครงการ การระดมความคิด และการนำเสนอข้อมูลในรูปแบบที่เข้าใจง่าย ซึ่งช่วยให้ผู้ชมสามารถเข้าใจภาพรวมและรายละเอียดได้อย่างมีประสิทธิภาพ`
    }

    if (
      questionLower.includes("วิธีการ") ||
      questionLower.includes("ขั้นตอน") ||
      questionLower.includes("how to") ||
      questionLower.includes("steps")
    ) {
      return `วิธีการใช้ ${topic} มีขั้นตอนดังนี้: 1) กำหนดหัวข้อหลักที่ต้องการนำเสนอ 2) ระบุหัวข้อย่อยที่เกี่ยวข้อง 3) สร้างความเชื่อมโยงระหว่างหัวข้อต่างๆ 4) เพิ่มรายละเอียดและตัวอย่างประกอบ 5) ทบทวนและปรับปรุงให้มีความชัดเจนและเข้าใจง่าย`
    }

    // Default response
    return `เกี่ยวกับ ${topic} นั้น มีประเด็นที่น่าสนใจหลายอย่าง ทั้งในแง่ของการประยุกต์ใช้ในชีวิตประจำวัน การพัฒนาความรู้ และการแก้ปัญหาต่างๆ คุณสามารถถามเพิ่มเติมเกี่ยวกับประโยชน์ ตัวอย่าง หรือวิธีการใช้งานได้`
  }

  // Main rendering function
  const renderMindMap = () => {
    if (!processedData || !svgRef.current || !containerRef.current) return

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove()

    // Get container dimensions
    const containerWidth = containerRef.current.clientWidth
    const containerHeight = isFullscreen
      ? window.innerHeight - 100 // Leave space for controls in fullscreen
      : isMobile
        ? window.innerHeight * 0.6
        : window.innerHeight * 0.7

    // Calculate dimensions based on data complexity
    const nodeCount = countNodes(processedData)
    const baseRadius = Math.min(containerWidth, containerHeight) / 4
    const radius = Math.max(baseRadius, Math.min(nodeCount * 15, containerWidth / 2))

    // Create the SVG container
    const svg = d3
      .select(svgRef.current)
      .attr("width", containerWidth)
      .attr("height", containerHeight)
      .attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet")

    // Improve touch interactions
    svg.on("touchstart", function () {
      d3.select(this).style("cursor", "grabbing")
    })

    svg.on("touchend", function () {
      d3.select(this).style("cursor", "grab")
    })

    // Create a group for the mind map with initial transform
    const g = svg
      .append("g")
      .attr("transform", `translate(${containerWidth / 2}, ${containerHeight / 2}) scale(${zoomLevel})`)
      .attr("class", "mind-map-container")

    // Create zoom behavior with inertia
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
      })

    // Apply zoom behavior to SVG
    svg.call(zoom as any)

    // Prepare the data in hierarchical structure
    const root = d3.hierarchy(processedData)

    // Create a radial tree layout
    const treeLayout = d3
      .tree<MindMapNode>()
      .size([2 * Math.PI, radius])
      .separation((a, b) => {
        // Adjust separation based on depth and number of siblings
        const baseSeparation = (a.parent === b.parent ? 1.5 : 2.5) / a.depth
        // Increase separation for leaf nodes
        return a.data.isLeafNode || b.data.isLeafNode ? baseSeparation * 1.5 : baseSeparation
      })

    // Apply the layout to the data
    const treeData = treeLayout(root as any)

    // Create links
    const linkGenerator = d3
      .linkRadial<d3.HierarchyPointLink<MindMapNode>, d3.HierarchyPointNode<MindMapNode>>()
      .angle((d) => (d as any).x)
      .radius((d) => (d as any).y)

    // Define color scales for branches and nodes
    const branchColorScale = d3.scaleOrdinal([
      "#4f46e5", // indigo
      "#06b6d4", // cyan
      "#ec4899", // pink
      "#f59e0b", // amber
      "#10b981", // emerald
      "#8b5cf6", // violet
    ])

    // Add links (branches)
    g.selectAll(".link")
      .data(treeData.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", linkGenerator as any)
      .attr("fill", "none")
      .attr("stroke", (d) => {
        // Color based on the main branch
        if (d.source.depth === 0) return "#ffffff"
        if (d.source.depth === 1) return branchColorScale(d.source.data.name || "")
        // Inherit color from parent for deeper levels
        return branchColorScale(findMainBranchName(d.source) || "")
      })
      .attr("stroke-width", (d) => {
        // Thicker lines for main branches, thinner for deeper levels
        const baseWidth = 3
        return baseWidth - d.source.depth * 0.5
      })
      .attr("stroke-opacity", 0.8)
      .attr("stroke-linecap", "round")
      .style("transition", "stroke-width 0.3s ease")

    // Add nodes
    const nodes = g
      .selectAll(".node")
      .data(treeData.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${radialPoint(d.x, d.y)})`)
      .attr("data-depth", (d) => d.depth)
      .attr("data-id", (d) => d.data.id || "")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        handleNodeClick(d.data.id || "", event)
      })
      .on("keydown", (event, d) => {
        // Add keyboard navigation
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          handleNodeClick(d.data.id || "", event as any)
        }
      })
      .attr("tabindex", "0") // Make nodes focusable for keyboard navigation
      .attr("role", "button")
      .attr("aria-expanded", (d) => (d.data.id === activeNode ? "true" : "false"))

    // Add node backgrounds (boxes for non-root nodes)
    nodes.each(function (d) {
      const node = d3.select(this)
      const isActive = d.data.id === activeNode
      const isAiContentNode = d.data.id === aiContentNode

      if (d.depth === 0) {
        // Root node gets a circle
        node
          .append("circle")
          .attr("r", 40)
          .attr("fill", "#6366f1")
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 1.5)
          .attr("opacity", 1)
          .attr("filter", "drop-shadow(0px 2px 3px rgba(0,0,0,0.2))")
          .attr("class", "node-circle")
          .style("transition", "all 0.3s ease")
      } else {
        // Get the text content to determine box size
        const textContent = d.data.topic || d.data.name || ""
        const description = d.data.description || ""

        // Calculate text dimensions for proper sizing
        const tempText = document.createElement("span")
        tempText.style.font = isActive ? "bold 12px sans-serif" : "normal 11px sans-serif"
        tempText.style.position = "absolute"
        tempText.style.visibility = "hidden"
        tempText.style.whiteSpace = "nowrap"
        tempText.textContent = textContent
        document.body.appendChild(tempText)

        const textWidth = tempText.offsetWidth
        document.body.removeChild(tempText)

        // Calculate box dimensions based on text length and depth
        let boxWidth, boxHeight

        if (isActive) {
          // For active nodes, calculate size based on content
          const words = textContent.split(" ")
          const charsPerLine = 25
          const lines = Math.ceil(textContent.length / charsPerLine)
          const descLines = description ? Math.ceil(description.length / charsPerLine) : 0

          boxWidth = Math.max(150, Math.min(textWidth * 1.2, 250))
          boxHeight = Math.max(60, (lines + descLines) * 16 + 20)

          // Add extra height for AI content button
          boxHeight += 30
        } else {
          // For inactive nodes
          boxWidth = Math.max(30, Math.min(textWidth + 20, 150))
          boxHeight = 30
        }

        // Add expandable indicator for nodes with children or description
        const hasExpandableContent = d.data.children.length > 0 || d.data.description

        // Add rounded rectangle for non-root nodes with animation
        const rect = node
          .append("rect")
          .attr("x", -boxWidth / 2)
          .attr("y", -boxHeight / 2)
          .attr("width", boxWidth)
          .attr("height", boxHeight)
          .attr("rx", 15) // Rounded corners
          .attr("ry", 15)
          .attr("fill", () => {
            if (isActive) return "#ffffff"
            if (d.data.isLeafNode) return "#ffffff"
            if (d.depth === 1) return branchColorScale(d.data.name || "")
            return branchColorScale(findMainBranchName(d) || "")
          })
          .attr("stroke", () => {
            if (isActive) return "#6366f1"
            if (isAiContentNode) return "#10b981" // Green border for AI content node
            if (d.data.isLeafNode) {
              return branchColorScale(findMainBranchName(d) || "")
            }
            return "#ffffff"
          })
          .attr("stroke-width", isActive || isAiContentNode ? 2.5 : d.data.isLeafNode ? 2 : 1)
          .attr("opacity", isActive ? 1 : d.data.isLeafNode ? 0.9 : 0.8)
          .attr(
            "filter",
            isActive || isAiContentNode
              ? "drop-shadow(0px 4px 6px rgba(99, 102, 241, 0.5))"
              : "drop-shadow(0px 2px 3px rgba(0,0,0,0.2))",
          )
          .attr("class", "node-box")
          .classed("active", isActive)
          .classed("ai-content", isAiContentNode)
          .style("transition", "all 0.3s ease")

        // Add expandable indicator if node has children or description
        if (hasExpandableContent && d.depth > 0) {
          // Create a larger touch target for the expand/collapse icon
          const iconSize = 24
          const iconX = boxWidth / 2 - iconSize / 2
          const iconY = boxHeight / 2 - iconSize / 2

          // Add a transparent touch area
          node
            .append("rect")
            .attr("x", iconX - 5)
            .attr("y", iconY - 5)
            .attr("width", iconSize + 10)
            .attr("height", iconSize + 10)
            .attr("fill", "transparent")
            .attr("class", "expand-touch-target")
            .style("cursor", "pointer")

          // Add the icon background
          node
            .append("circle")
            .attr("cx", boxWidth / 2 - 8)
            .attr("cy", boxHeight / 2 - 8)
            .attr("r", 8)
            .attr("fill", "#ffffff")
            .attr("stroke", d.data.isLeafNode ? branchColorScale(findMainBranchName(d) || "") : "#ffffff")
            .attr("stroke-width", 1)
            .attr("opacity", 0.9)
            .attr("class", "expand-icon-bg")
            .style("transition", "all 0.2s ease")

          // Add the + or - icon
          node
            .append("text")
            .attr("x", boxWidth / 2 - 8)
            .attr("y", boxHeight / 2 - 5)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .attr("fill", d.data.isLeafNode ? branchColorScale(findMainBranchName(d) || "") : "#000000")
            .text(isActive ? "−" : "+")
            .attr("class", "expand-icon")
            .style("transition", "all 0.2s ease")
        }

        // Add book icon for AI content generation if node is active
        if (isActive) {
          // Create a book icon button
          const bookIconY = boxHeight / 2 - 25 // Position at the bottom of the box

          // Add the icon background
          node
            .append("circle")
            .attr("cx", 0)
            .attr("cy", bookIconY)
            .attr("r", 12)
            .attr("fill", "#f0f9ff") // Light blue background
            .attr("stroke", "#6366f1")
            .attr("stroke-width", 1)
            .attr("opacity", 0.9)
            .attr("class", "book-icon-bg")
            .style("cursor", "pointer")
            .style("transition", "all 0.2s ease")
            .on("click", (event) => {
              event.stopPropagation()
              handleGenerateContent(d.data.id || "", d.data.name || d.data.topic || "")
            })

          // Add the book icon
          node
            .append("g")
            .attr("transform", `translate(-6, ${bookIconY - 6})`)
            .attr("class", "book-icon")
            .style("cursor", "pointer")
            .style("transition", "all 0.2s ease")
            .on("click", (event) => {
              event.stopPropagation()
              handleGenerateContent(d.data.id || "", d.data.name || d.data.topic || "")
            })
            .html(`
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
            `)

          // Add text label for the book icon
          node
            .append("text")
            .attr("x", 0)
            .attr("y", bookIconY + 20)
            .attr("text-anchor", "middle")
            .attr("font-size", "8px")
            .attr("fill", "#6366f1")
            .text("ขยายความ")
            .style("cursor", "pointer")
            .style("transition", "all 0.2s ease")
            .on("click", (event) => {
              event.stopPropagation()
              handleGenerateContent(d.data.id || "", d.data.name || d.data.topic || "")
            })
        }
      }
    })

    // Add text labels
    nodes.each(function (d) {
      const node = d3.select(this)
      const isActive = d.data.id === activeNode
      const text = d.data.topic || d.data.name || ""

      if (isActive && d.depth > 0) {
        // For active nodes, show full text with wrapping
        const textElement = node
          .append("text")
          .attr("dy", -20) // Move text up to make room for description and book icon
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", "#000000")
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .attr("class", "select-none node-text")
          .style("transition", "opacity 0.3s ease")

        // Calculate optimal text wrapping
        const maxWidth = 230 // Maximum width for text in expanded box
        const words = text.split(" ")
        let line = ""
        let lineNumber = 0
        const lineHeight = 16

        words.forEach((word, i) => {
          const testLine = line + word + " "
          const testWidth = getTextWidth(testLine, "bold 12px sans-serif")

          // Check if adding this word would exceed the max width
          if (testWidth > maxWidth && i > 0) {
            // Add the current line
            textElement
              .append("tspan")
              .attr("x", 0)
              .attr("dy", lineNumber === 0 ? 0 : lineHeight)
              .text(line)

            line = word + " "
            lineNumber++
          } else {
            line = testLine
          }

          // Add the last line
          if (i === words.length - 1) {
            textElement
              .append("tspan")
              .attr("x", 0)
              .attr("dy", lineNumber === 0 ? 0 : lineHeight)
              .text(line)
          }
        })

        // Add description if available
        if (d.data.description) {
          const descElement = node
            .append("text")
            .attr("dy", lineNumber > 0 ? 20 : 15) // Increased spacing between title and description
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("fill", "#666666")
            .attr("font-size", "10px")
            .attr("font-style", "italic")
            .attr("class", "select-none node-description")
            .style("transition", "opacity 0.3s ease")

          // Wrap description text
          const descWords = d.data.description.split(" ")
          let descLine = ""
          let descLineNumber = 0
          const descLineHeight = 14

          descWords.forEach((word, i) => {
            const testLine = descLine + word + " "
            const testWidth = getTextWidth(testLine, "italic 10px sans-serif")

            if (testWidth > maxWidth && i > 0) {
              descElement
                .append("tspan")
                .attr("x", 0)
                .attr("dy", descLineNumber === 0 ? 0 : descLineHeight)
                .text(descLine)

              descLine = word + " "
              descLineNumber++
            } else {
              descLine = testLine
            }

            if (i === descWords.length - 1) {
              descElement
                .append("tspan")
                .attr("x", 0)
                .attr("dy", descLineNumber === 0 ? 0 : descLineHeight)
                .text(descLine)
            }
          })
        }
      } else {
        // For non-active nodes, show truncated text
        node
          .append("text")
          .attr("dy", 0)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .text(() => {
            // Limit text length based on depth to prevent overflow
            const maxLength = d.depth === 0 ? 25 : d.depth === 1 ? 20 : 15
            return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
          })
          .attr("fill", (d) => {
            if (d.depth === 0) return "#ffffff" // Root node text is white
            if (d.data.isLeafNode) return "#000000" // Leaf node text is black
            return "#ffffff" // Other node text is white
          })
          .attr("font-size", (d) => {
            if (d.depth === 0) return "14px"
            if (d.depth === 1) return "12px"
            return "11px"
          })
          .attr("font-weight", (d) => (d.depth <= 1 ? "bold" : "normal"))
          .attr("class", "select-none node-text")
          .style("transition", "opacity 0.3s ease")
      }
    })

    // Add description tooltips for all nodes
    nodes.append("title").text((d) => {
      const title = d.data.topic || d.data.name || ""
      const desc = d.data.description ? `: ${d.data.description}` : ""
      return `${title}${desc}`
    })

    // Add visual feedback for active node
    if (activeNode) {
      const activeNodeElement = g.select(`[data-id="${activeNode}"]`)

      // Add subtle pulse animation
      const pulseAnimation = () => {
        activeNodeElement
          .select("rect")
          .transition()
          .duration(1000)
          .attr("stroke-width", 3)
          .transition()
          .duration(1000)
          .attr("stroke-width", 2.5)
          .on("end", pulseAnimation)
      }

      pulseAnimation()
    }

    // Helper function to convert polar to Cartesian coordinates
    function radialPoint(x: number, y: number): [number, number] {
      return [(y = +y) * Math.cos((x -= Math.PI / 2)), y * Math.sin(x)]
    }

    // Helper function to find the main branch name for a node
    function findMainBranchName(node: d3.HierarchyPointNode<MindMapNode>): string | undefined {
      if (node.depth <= 1) return node.data.name
      let current = node
      while (current.parent && current.parent.depth !== 1) {
        current = current.parent
      }
      return current.data.name
    }
  }

  // Helper function to count nodes in the data
  const countNodes = (node: MindMapNode): number => {
    let count = 1 // Count the node itself
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        count += countNodes(child)
      })
    }
    return count
  }

  // Effect to render the mind map when data or zoom level changes
  useEffect(() => {
    if (processedData) {
      renderMindMap()
    }
  }, [processedData, zoomLevel, activeNode, isFullscreen, aiContentNode])

  // Effect to handle window resize
  useEffect(() => {
    const handleResize = () => {
      renderMindMap()
    }

    window.addEventListener("resize", handleResize)
    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [processedData])

  // Get active node data
  const activeNodeData = activeNode ? findNodeById(activeNode) : null
  const activeNodeName = activeNodeData?.name || activeNodeData?.topic || ""

  return (
    <div className="w-full flex flex-col">
      <div className="flex justify-center space-x-2 mb-4">
        <Button
          onClick={zoomOut}
          variant="outline"
          size={isMobile ? "icon" : "sm"}
          className="bg-white/10 hover:bg-white/20 text-white"
          aria-label="ซูมออก"
        >
          <ZoomOut size={isMobile ? 14 : 16} />
        </Button>
        <Button
          onClick={resetView}
          variant="outline"
          size={isMobile ? "icon" : "sm"}
          className="bg-white/10 hover:bg-white/20 text-white"
          aria-label="รีเซ็ตมุมมอง"
        >
          <RefreshCw size={isMobile ? 14 : 16} className={isLoading ? "animate-spin" : ""} />
        </Button>
        <Button
          onClick={zoomIn}
          variant="outline"
          size={isMobile ? "icon" : "sm"}
          className="bg-white/10 hover:bg-white/20 text-white"
          aria-label="ซูมเข้า"
        >
          <ZoomIn size={isMobile ? 14 : 16} />
        </Button>
        <Button
          onClick={toggleFullscreen}
          variant="outline"
          size={isMobile ? "icon" : "sm"}
          className="bg-white/10 hover:bg-white/20 text-white"
          aria-label={isFullscreen ? "ออกจากโหมดเต็มจอ" : "เข้าสู่โหมดเต็มจอ"}
        >
          {isFullscreen ? <Minimize size={isMobile ? 14 : 16} /> : <Maximize size={isMobile ? 14 : 16} />}
        </Button>
        {activeNode && (
          <Button
            onClick={() => {
              setActiveNode(null)
              setAiContentNode(null)
              setAiContent(null)
              setChatMessages([])
            }}
            variant="outline"
            size={isMobile ? "icon" : "sm"}
            className="bg-white/10 hover:bg-white/20 text-white"
            aria-label="ปิดรายละเอียด"
          >
            <X size={isMobile ? 14 : 16} />
          </Button>
        )}
      </div>

      <div
        ref={containerRef}
        className={cn(
          "w-full overflow-hidden flex justify-center bg-[#0a1f38] rounded-lg p-2 relative",
          isFullscreen && "fixed inset-0 z-50 rounded-none",
        )}
        style={{
          minHeight: isFullscreen ? "100vh" : isMobile ? "60vh" : "70vh",
          touchAction: "manipulation", // Improve touch handling
        }}
        onClick={() => {
          // Close expanded node when clicking on background
          if (activeNode) {
            setActiveNode(null)
            setAiContentNode(null)
            setAiContent(null)
            setChatMessages([])
          }
        }}
      >
        <svg ref={svgRef} className="touch-manipulation" style={{ cursor: "grab" }} />

        {/* AI Content Panel */}
        {aiContentNode && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg max-h-[60vh] overflow-hidden z-10 animate-slide-up flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-black font-bold flex items-center">
                  <Book size={16} className="mr-2 text-emerald-600" />
                  <span>ขยายความ: {activeNodeName}</span>
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation()
                    setAiContentNode(null)
                    setAiContent(null)
                    setChatMessages([])
                  }}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-grow">
              <div className="text-gray-700 text-sm">
                {isGeneratingContent ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="h-5 w-5 mr-2 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
                    <span>กำลังสร้างเนื้อหา...</span>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    {aiContent &&
                      aiContent.split("\n").map((paragraph, index) => (
                        <p key={index} className="mb-2">
                          {paragraph}
                        </p>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chat Interface */}
            <div className="border-t border-gray-100">
              <div
                ref={chatContainerRef}
                className="max-h-[200px] overflow-y-auto p-3 bg-gray-50"
                style={{ display: chatMessages.length > 0 ? "block" : "none" }}
              >
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`mb-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                    <div
                      className={`inline-block rounded-lg px-3 py-2 text-sm max-w-[80%] ${
                        msg.role === "user" ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-800"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="text-left mb-2">
                    <div className="inline-block rounded-lg px-3 py-2 text-sm bg-gray-200 text-gray-800">
                      <div className="flex items-center space-x-1">
                        <div
                          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleChatSubmit} className="p-2 flex items-center">
                <Input
                  ref={chatInputRef}
                  type="text"
                  placeholder="ถามคำถามเกี่ยวกับหัวข้อนี้..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-grow mr-2 border-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="bg-indigo-500 hover:bg-indigo-600 text-white"
                  disabled={isChatLoading}
                >
                  <Send size={16} />
                </Button>
              </form>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-center text-xs sm:text-sm text-gray-400">
        <p className="mb-1">
          {isMobile ? "แตะที่กล่องข้อความที่มีเครื่องหมาย + เพื่อดูรายละเอียด" : "คลิกที่กล่องข้อความที่มีเครื่องหมาย + เพื่อดูรายละเอียด"}
        </p>
        <p>{isMobile ? "แตะที่ไอคอนหนังสือเพื่อขยายความและสอบถามเพิ่มเติม" : "คลิกที่ไอคอนหนังสือเพื่อขยายความและสอบถามเพิ่มเติม"}</p>
      </div>
    </div>
  )
}
