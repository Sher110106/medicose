"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Calendar, Clock, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useSpeech } from "@/hooks/use-speech"
import { SpeakableElement } from "./SpeakableElement"

type ProductEntry = {
  id: string
  productName: string
  expiryDate: string
  dateScanned: string
}

export function History() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("dateScanned")
  const [sortOrder, setSortOrder] = useState("desc")
  const [products, setProducts] = useState<ProductEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { speak } = useSpeech()
  const hasAnnouncedLoading = useRef(false)
  const hasAnnouncedResults = useRef(false)
  
  useEffect(() => {
    // Only announce loading once
    if (!hasAnnouncedLoading.current) {
      speak('Loading your product history')
      hasAnnouncedLoading.current = true;
    }
    
    // Simulate fetching data from a database - only do this once
    if (isLoading) {
      const timer = setTimeout(() => {
        const mockData: ProductEntry[] = [
          {
            id: "1",
            productName: "Aspirin 100mg",
            expiryDate: "2025-06-30",
            dateScanned: "2023-05-15T10:30:00Z",
          },
          {
            id: "2",
            productName: "Vitamin D3",
            expiryDate: "2024-12-31",
            dateScanned: "2023-05-10T14:45:00Z",
          },
          {
            id: "3",
            productName: "Allergy Relief",
            expiryDate: "2023-09-15",
            dateScanned: "2023-05-05T09:20:00Z",
          },
          {
            id: "4",
            productName: "Ibuprofen 200mg",
            expiryDate: "2026-03-22",
            dateScanned: "2023-05-01T16:10:00Z",
          },
          {
            id: "5",
            productName: "Multivitamin Complex",
            expiryDate: "2024-08-10",
            dateScanned: "2023-04-28T11:05:00Z",
          },
        ]
        setProducts(mockData)
        setIsLoading(false)
        
        // Only announce results once
        if (!hasAnnouncedResults.current) {
          speak(`Found ${mockData.length} products in your history. Use tab to navigate through them.`)
          hasAnnouncedResults.current = true;
        }
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [speak, isLoading])

  // Reset announcement flags when component is unmounted
  useEffect(() => {
    return () => {
      hasAnnouncedLoading.current = false;
      hasAnnouncedResults.current = false;
    }
  }, [])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    } catch {
      return dateString
    }
  }

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc"
    setSortOrder(newOrder)
    speak(`Sorting ${sortBy} ${newOrder}ending`)
  }

  const handleSortChange = (value: string) => {
    setSortBy(value)
    speak(`Sorting by ${value}`)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    if (value) {
      const matches = products.filter(product => 
        product.productName.toLowerCase().includes(value.toLowerCase())
      ).length
      speak(`Found ${matches} products matching ${value}`)
    }
  }

  const filteredProducts = products
    .filter((product) => product.productName.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "expiryDate") {
        return sortOrder === "asc"
          ? new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
          : new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime()
      } else {
        return sortOrder === "asc"
          ? new Date(a.dateScanned).getTime() - new Date(b.dateScanned).getTime()
          : new Date(b.dateScanned).getTime() - new Date(a.dateScanned).getTime()
      }
    })

  return (
    <div 
      className="space-y-6"
      role="region"
      aria-label="Product history"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <SpeakableElement text="Search products field. Type to filter the product list.">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 h-12 text-lg"
              aria-label="Search products"
              onFocus={() => speak('Search products. Type to filter the list.')}
            />
          </div>
        </SpeakableElement>
        <div 
          className="flex gap-2"
          role="group"
          aria-label="Sort controls"
        >
          <SpeakableElement text="Sort by dropdown. Choose between sorting by expiry date or date scanned.">
            <Select 
              value={sortBy} 
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[180px] h-12 text-lg" aria-label="Sort by">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expiryDate">Expiry Date</SelectItem>
                <SelectItem value="dateScanned">Date Scanned</SelectItem>
              </SelectContent>
            </Select>
          </SpeakableElement>
          <SpeakableElement text={`Sort order button. Currently sorting ${sortOrder === "asc" ? "ascending" : "descending"}. Press to toggle.`}>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12"
              onClick={toggleSortOrder}
              aria-label={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}. Current order: ${sortOrder}ending`}
              onFocus={() => speak(`Press Enter to change sort order. Currently sorting ${sortOrder}ending`)}
            >
              <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
            </Button>
          </SpeakableElement>
        </div>
      </div>

      {isLoading ? (
        <div 
          className="text-center py-8"
          role="status"
          aria-live="polite"
        >
          <p className="text-lg">Loading your product history...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div 
          className="text-center py-8 border rounded-lg"
          role="status"
          aria-live="polite"
        >
          <p className="text-lg">No products found</p>
          {searchTerm && <p className="text-muted-foreground mt-2">Try a different search term</p>}
        </div>
      ) : (
        <div 
          className="grid gap-4"
          role="list"
          aria-label="Product list"
        >
          {filteredProducts.map((product) => (
            <SpeakableElement 
              key={product.id}
              text={`${product.productName} expires on ${formatDate(product.expiryDate)}. Scanned on ${formatDate(product.dateScanned)}`}
            >
              <Card 
                className="overflow-hidden"
                role="listitem"
                tabIndex={0}
                onFocus={() => speak(`${product.productName}, expires on ${formatDate(product.expiryDate)}`)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl">{product.productName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2">
                    <div 
                      className="flex items-center gap-2"
                      role="group"
                      aria-label="Expiry date"
                    >
                      <Calendar className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      <span className="text-lg">
                        <span className="sr-only">Expires on:</span> {formatDate(product.expiryDate)}
                      </span>
                    </div>
                    <div 
                      className="flex items-center gap-2"
                      role="group"
                      aria-label="Scan date"
                    >
                      <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                      <span className="text-sm text-muted-foreground">
                        <span className="sr-only">Scanned on:</span> {formatDate(product.dateScanned)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </SpeakableElement>
          ))}
        </div>
      )}

      <div 
        className="sr-only" 
        role="status" 
        aria-live="polite"
      >
        {`${filteredProducts.length} products shown`}
      </div>
    </div>
  )
}

