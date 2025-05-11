"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { ZoomIn, ZoomOut, RefreshCw, X, Maximize, Minimize, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import AIContentModal from "@/components/ai-content-modal"

interface MindMapNode {
  topic?: string
  name?: string
  description?: string
  isLeafNode?: boolean
  children: MindMapNode[]
  id?: string
}

interface EnhancedMindMapProps {
  data: MindMapNode
}

export default function EnhancedMindMap({ data }: EnhancedMindMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [activeNode, setActiveNode] = useState<string | null>(null)
  const [processedData, setProcessedData] = useState<MindMapNode | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [selectedTopic, setSelectedTopic] = useState<{ topic: string; description?: string }>({ topic: "" })

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
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])

  // Function to toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    // Give the DOM time to update before re-rendering the mind map
    setTimeout(() => {
      renderMindMap()
    }, 100)
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
  const handleNodeClick = (nodeId: string, node: MindMapNode) => {
    setActiveNode(activeNode === nodeId ? null : nodeId)
  }

  // Function to open AI content modal
  const openAIContent = (node: MindMapNode) => {
    const topicText = node.topic || node.name || "ไม่ระบุหัวข้อ"
    setSelectedTopic({
      topic: topicText,
      description: node.description,
    })
    setShowAIModal(true)
  }

  // Main rendering function
  const renderMindMap = () => {
    if (!processedData || !svgRef.current || !containerRef.current) return

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove()

    // Get container dimensions
    const containerWidth = containerRef.current.clientWidth
    const containerHeight = containerRef.current.clientHeight || window.innerHeight * 0.7

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

    // Create a group for the mind map with initial transform
    const g = svg
      .append("g")
      .attr("transform", `translate(${containerWidth / 2}, ${containerHeight / 2}) scale(${zoomLevel})`)

    // Create zoom behavior
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
      .attr("stroke-dasharray", (d) => (d.target.data.isLeafNode ? "5,5" : "none"))

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
        event.stopPropagation()
        handleNodeClick(d.data.id || "", d.data)
      })

    // Add node backgrounds (boxes for non-root nodes)
    nodes.each(function (d) {
      const node = d3.select(this)
      const isActive = d.data.id === activeNode

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
      } else {
        // Get the text content to determine box size
        const textContent = d.data.topic || d.data.name || ""
        const textLength = textContent.length

        // Calculate box dimensions based on text length and depth
        const boxWidth = isActive
          ? Math.max(150, Math.min(textLength * 8, 250))
          : Math.max(30, Math.min(textLength * 7, 150))
        const boxHeight = isActive ? 80 : 30

        // Add rounded rectangle for non-root nodes
        node
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
            if (d.data.isLeafNode) {
              return branchColorScale(findMainBranchName(d) || "")
            }
            return "#ffffff"
          })
          .attr("stroke-width", isActive ? 2.5 : d.data.isLeafNode ? 2 : 1)
          .attr("opacity", isActive ? 1 : d.data.isLeafNode ? 0.9 : 0.8)
          .attr("filter", "drop-shadow(0px 2px 3px rgba(0,0,0,0.2))")
          .classed("node-box", true)
          .classed("active", isActive)

        // Add book icon for active nodes
        if (isActive) {
          // Create a group for the chat icon
          const iconGroup = node
            .append("g")
            .attr("transform", `translate(${boxWidth / 2 - 25}, ${-boxHeight / 2 + 15})`)
            .style("cursor", "pointer")
            .on("click", (event) => {
              event.stopPropagation()
              openAIContent(d.data)
            })

          // Add circle background for the icon
          iconGroup
            .append("circle")
            .attr("r", 12)
            .attr("fill", "#6366f1")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 1)

          // Add chat icon (simplified path)
          iconGroup
            .append("path")
            .attr("d", "M3,3 v9 h4 l2,3 l2,-3 h4 v-9 z")
            .attr("transform", "translate(-7.5, -6)")
            .attr("fill", "#ffffff")
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 0.5)
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
          .attr("dy", -25) // Move text up to make room for description
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", "#000000")
          .attr("font-size", "12px")
          .attr("font-weight", "bold")
          .attr("class", "select-none")

        // Split text into multiple lines if needed
        const words = text.split(" ")
        let line = ""
        let lineNumber = 0
        const lineHeight = 16

        words.forEach((word, i) => {
          const testLine = line + word + " "

          // Check if adding this word would exceed the max width
          if (testLine.length > 25 && i > 0) {
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
          node
            .append("text")
            .attr("dy", 15) // Position description below the title
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("fill", "#666666")
            .attr("font-size", "10px")
            .attr("font-style", "italic")
            .attr("class", "select-none")
            .text(() => {
              // Truncate description if too long
              return d.data.description && d.data.description.length > 40
                ? d.data.description.substring(0, 40) + "..."
                : d.data.description
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
          .attr("class", "select-none")
      }
    })

    // Add description tooltips for all nodes
    nodes.append("title").text((d) => {
      const title = d.data.topic || d.data.name || ""
      const desc = d.data.description ? `: ${d.data.description}` : ""
      return `${title}${desc}`
    })

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
  }, [processedData, zoomLevel, activeNode, isFullscreen])

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

  // Prevent zoom on mobile when touching text boxes
  useEffect(() => {
    const preventZoom = (e: TouchEvent) => {
      if ((e.target as HTMLElement)?.closest(".node-box")) {
        if (e.touches.length < 2) {
          // Allow pinch zoom
          e.preventDefault()
        }
      }
    }

    document.addEventListener("touchstart", preventZoom, { passive: false })
    return () => {
      document.removeEventListener("touchstart", preventZoom)
    }
  }, [])

  return (
    <div className={`w-full flex flex-col ${isFullscreen ? "fixed inset-0 z-50 bg-[#081a2f]" : ""}`}>
      {!isFullscreen && (
        <div className="flex justify-center space-x-2 mb-4">
          <Button onClick={zoomOut} variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white">
            <ZoomOut size={16} />
          </Button>
          <Button onClick={resetView} variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white">
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </Button>
          <Button onClick={zoomIn} variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white">
            <ZoomIn size={16} />
          </Button>
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </Button>
          {activeNode && (
            <Button
              onClick={() => setActiveNode(null)}
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white"
            >
              <X size={16} />
            </Button>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        className={`w-full overflow-hidden flex justify-center bg-[#0a1f38] ${isFullscreen ? "" : "rounded-lg p-2"}`}
        style={{
          minHeight: isFullscreen ? "100vh" : isMobile ? "50vh" : "70vh",
          height: isFullscreen ? "100vh" : "",
        }}
      >
        <svg ref={svgRef} className="touch-manipulation" style={{ cursor: "grab" }} />

        {isFullscreen && (
          <Button
            onClick={toggleFullscreen}
            variant="outline"
            size="sm"
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white z-50"
          >
            <Minimize size={16} />
          </Button>
        )}
      </div>

      {!isFullscreen && (
        <div className="mt-4 text-center text-sm text-gray-400">
          <p className="mb-1">{isMobile ? "แตะที่กล่องข้อความเพื่อดูรายละเอียดเพิ่มเติม" : "คลิกที่กล่องข้อความเพื่อดูรายละเอียดเพิ่มเติม"}</p>
          <p>{isMobile ? "ใช้นิ้วเลื่อนเพื่อดูทั้งหมด หรือใช้ปุ่มซูมเพื่อปรับขนาด" : "ลากเพื่อเลื่อน ใช้ปุ่มซูมเพื่อปรับขนาด"}</p>
          <p className="mt-1 text-cyan-400">
            คลิกที่ไอคอนแชท <MessageSquare className="inline h-3 w-3" /> เพื่อดูเนื้อหาเพิ่มเติมและถามคำถาม
          </p>
        </div>
      )}

      {/* AI Content Modal */}
      <AIContentModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        topic={selectedTopic.topic}
        description={selectedTopic.description}
      />
    </div>
  )
}
