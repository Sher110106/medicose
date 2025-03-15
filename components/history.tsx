"use client"

import { useState, useEffect } from "react"
import { Search, Calendar, Clock, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

  useEffect(() => {
    // Simulate fetching data from a database
    // In a real app, this would call an API to fetch the data
    setTimeout(() => {
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
    }, 1000)
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
    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 text-lg"
            aria-label="Search products"
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px] h-12 text-lg">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expiryDate">Expiry Date</SelectItem>
              <SelectItem value="dateScanned">Date Scanned</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12"
            onClick={toggleSortOrder}
            aria-label={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
          >
            <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-lg">Loading your product history...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-8 border rounded-lg">
          <p className="text-lg">No products found</p>
          {searchTerm && <p className="text-muted-foreground mt-2">Try a different search term</p>}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">{product.productName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <span className="text-lg">
                      <span className="sr-only">Expires on:</span> {formatDate(product.expiryDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm text-muted-foreground">
                      <span className="sr-only">Scanned on:</span> {formatDate(product.dateScanned)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

