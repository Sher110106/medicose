"use client"
import { useState, useEffect } from "react"
import { Search, Calendar, Clock, ArrowUpDown, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SpeakableElement } from "@/components/speakable-element"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ResultsDisplay } from "@/components/results-display"
import { MedicineInformation } from "@/lib/utils"

type ProductEntry = {
  id: string
  productName: string
  expiryDate: string
  dateScanned: string
  detailedInfo?: MedicineInformation
  rawText?: string
}

export function History() {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState("dateScanned")
  const [sortOrder, setSortOrder] = useState("desc")
  const [products, setProducts] = useState<ProductEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<ProductEntry | null>(null)
  
  useEffect(() => {
    // Fetch data from localStorage
    setIsLoading(true);
    
    try {
      const storedData = localStorage.getItem('medicineHistory');
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        setProducts(parsedData);
      } else {
        // No stored data found
        setProducts([]);
      }
    } catch (error) {
      console.error("Error loading history from localStorage:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  const handleProductClick = (product: ProductEntry) => {
    setSelectedProduct(product);
  };

  const handleDetailClose = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="space-y-6" role="region" aria-label="Product History">
      {selectedProduct ? (
        <div className="space-y-4">
          <Button 
            variant="outline" 
            onClick={handleDetailClose}
            className="mb-4"
          >
            Back to History
          </Button>
          <ResultsDisplay
            result={{
              success: true,
              productName: selectedProduct.productName,
              expiryDate: selectedProduct.expiryDate,
              detailedInfo: selectedProduct.detailedInfo,
              rawText: selectedProduct.rawText,
              expired: new Date() > new Date(selectedProduct.expiryDate)
            }}
            onSave={handleDetailClose}
            onCancel={handleDetailClose}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4">
            <SpeakableElement text="Search for products in history">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-lg"
                  aria-label="Search products"
                  role="searchbox"
                />
              </div>
            </SpeakableElement>
            <div className="flex gap-2">
              <SpeakableElement text="Sort products by date">
                <Select 
                  value={sortBy} 
                  onValueChange={setSortBy}
                  aria-label="Sort products by"
                >
                  <SelectTrigger className="w-[180px] h-12 text-lg">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expiryDate">Expiry Date</SelectItem>
                    <SelectItem value="dateScanned">Date Scanned</SelectItem>
                  </SelectContent>
                </Select>
              </SpeakableElement>
              <SpeakableElement text={`Change sort order to ${sortOrder === "asc" ? "descending" : "ascending"}`}>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12"
                  onClick={toggleSortOrder}
                  aria-label={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
                  aria-pressed={sortOrder === "asc"}
                >
                  <ArrowUpDown className="h-5 w-5" aria-hidden="true" />
                </Button>
              </SpeakableElement>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8" role="status" aria-live="polite">
              <p className="text-lg">Loading your product history...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 border rounded-lg" role="status" aria-live="polite">
              <p className="text-lg">No products found</p>
              {searchTerm && <p className="text-muted-foreground mt-2">Try a different search term</p>}
              {!searchTerm && products.length === 0 && (
                <p className="text-muted-foreground mt-2">Scan some products to build your history</p>
              )}
            </div>
          ) : (
            <div 
              className="grid gap-4" 
              role="list" 
              aria-label="Product history list"
            >
              {filteredProducts.map((product) => (
                <SpeakableElement
                  key={product.id}
                  text={`${product.productName}, expires on ${formatDate(product.expiryDate)}`}
                >
                  <div role="listitem">
                    <Card 
                      className="overflow-hidden cursor-pointer hover:border-primary transition-colors"
                      onClick={() => handleProductClick(product)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xl">{product.productName}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            <span className="text-lg">
                              Expires on: {formatDate(product.expiryDate)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            <span className="text-sm text-muted-foreground">
                              Scanned on: {formatDate(product.dateScanned)}
                            </span>
                          </div>
                        </div>
                        {new Date() > new Date(product.expiryDate) && (
                          <Alert variant="destructive" className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Expired Medicine</AlertTitle>
                            <AlertDescription>
                              This medicine has expired. Do not use expired medications.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </SpeakableElement>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

