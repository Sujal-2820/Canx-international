import { useMemo, useState, useEffect, useRef } from 'react'
import { useVendorState } from '../../../context/VendorContext'
import { PlusIcon, MinusIcon, TrashIcon, TruckIcon, ChevronRightIcon } from '../../../../User/components/icons'
import { cn } from '../../../../../lib/cn'
import { useVendorApi } from '../../../hooks/useVendorApi'
import { getPrimaryImageUrl } from '../../../../User/utils/productImages'
import { Trans } from '../../../../../components/Trans'
import { TransText } from '../../../../../components/TransText'

export function VendorCartView({ onUpdateQuantity, onRemove, onCheckout, onAddToCart, onNavigateToProduct }) {
    const { cart, settings } = useVendorState()
    const MIN_VENDOR_PURCHASE = settings?.minimumVendorPurchase || 50000
    const [suggestedProducts, setSuggestedProducts] = useState([])
    const [cartProducts, setCartProducts] = useState({})
    const [expandedVariants, setExpandedVariants] = useState({})
    const fetchingProductsRef = useRef(new Set())
    const { getProducts, getProductDetails } = useVendorApi()

    // Optimistic quantity state for instant UI updates
    const [optimisticQuantities, setOptimisticQuantities] = useState({})

    // Sync optimistic quantities when cart updates
    useEffect(() => {
        const newOptimisticQuantities = {}
        cart.forEach(item => {
            const id = `${item.productId}-${JSON.stringify(item.variantAttributes || {})}`
            newOptimisticQuantities[id] = item.quantity
        })
        setOptimisticQuantities(newOptimisticQuantities)
    }, [cart])

    // Fetch suggested products (exclude items already in cart)
    useEffect(() => {
        const loadSuggested = async () => {
            try {
                const cartProductIds = cart.map((item) => item.productId)
                const result = await getProducts({ limit: 20 })
                if (result.data?.products) {
                    const available = result.data.products.filter(
                        (p) => !cartProductIds.includes(p._id || p.id)
                    )
                    // Shuffle and take 8
                    const shuffled = [...available].sort(() => Math.random() - 0.5)
                    setSuggestedProducts(shuffled.slice(0, 8))
                }
            } catch (error) {
                console.error('Error loading suggested products:', error)
            }
        }

        if (cart.length > 0) {
            loadSuggested()
        }
    }, [cart, getProducts])

    // Fetch product details for cart items
    useEffect(() => {
        const loadCartProducts = async () => {
            setCartProducts(currentProducts => {
                const productsToFetch = cart.filter(item =>
                    !currentProducts[item.productId] && !fetchingProductsRef.current.has(item.productId)
                )

                if (productsToFetch.length === 0) {
                    return currentProducts
                }

                productsToFetch.forEach(item => fetchingProductsRef.current.add(item.productId))

                productsToFetch.forEach(async (item) => {
                    try {
                        const result = await getProductDetails(item.productId)
                        if (result.data?.product) {
                            setCartProducts(prev => ({
                                ...prev,
                                [item.productId]: result.data.product
                            }))
                        }
                    } catch (error) {
                        console.error(`Error loading product ${item.productId}:`, error)
                    } finally {
                        fetchingProductsRef.current.delete(item.productId)
                    }
                })

                return currentProducts
            })
        }

        if (cart.length > 0) {
            loadCartProducts()
        } else {
            setCartProducts({})
            fetchingProductsRef.current.clear()
        }
    }, [cart, getProductDetails])

    // Group items by productId
    const groupedCartItems = useMemo(() => {
        const grouped = {}

        cart.forEach((item) => {
            const product = cartProducts[item.productId]
            const unitPrice = item.unitPrice || item.price || (product ? (product.priceToVendor || product.price || 0) : 0)

            const variantAttrs = item.variantAttributes || {}
            const hasVariants = variantAttrs && typeof variantAttrs === 'object' && Object.keys(variantAttrs).length > 0
            const key = item.productId

            if (!grouped[key]) {
                grouped[key] = {
                    productId: item.productId,
                    product,
                    name: item.name || product?.name || 'Product',
                    image: product ? getPrimaryImageUrl(product) : (item.image || 'https://via.placeholder.com/400'),
                    variants: [],
                    hasVariants: false,
                }
            }

            const variantItem = {
                ...item,
                id: `${item.productId}-${JSON.stringify(variantAttrs)}`,
                unitPrice,
                variantAttributes: variantAttrs,
                hasVariants,
            }

            grouped[key].variants.push(variantItem)

            if (hasVariants) {
                grouped[key].hasVariants = true
            }
        })

        return Object.values(grouped)
    }, [cart, cartProducts])

    const totals = useMemo(() => {
        const subtotal = groupedCartItems.reduce((sum, group) => {
            return sum + group.variants.reduce((variantSum, variant) => {
                const variantId = variant.id
                const quantity = optimisticQuantities[variantId] !== undefined
                    ? optimisticQuantities[variantId]
                    : variant.quantity
                return variantSum + (variant.unitPrice * quantity)
            }, 0)
        }, 0)

        // Vendor specific delivery or handling logic
        const delivery = 0
        const total = subtotal + delivery
        const meetsMinimum = total >= MIN_VENDOR_PURCHASE

        return {
            subtotal,
            delivery,
            total,
            meetsMinimum,
            shortfall: meetsMinimum ? 0 : MIN_VENDOR_PURCHASE - total,
        }
    }, [groupedCartItems, optimisticQuantities, MIN_VENDOR_PURCHASE])

    const totalItemsCount = useMemo(() => {
        return groupedCartItems.reduce((sum, group) => sum + group.variants.length, 0)
    }, [groupedCartItems])

    if (groupedCartItems.length === 0) {
        return (
            <div className="user-cart-view vendor-cart-view space-y-4">
                <div className="text-center py-12">
                    <p className="text-lg font-semibold text-gray-700 mb-2"><Trans>Your catalog cart is empty</Trans></p>
                    <p className="text-sm text-gray-500"><Trans>Browse the admin catalog to add stock</Trans></p>
                </div>
            </div>
        )
    }

    return (
        <div className="user-cart-view vendor-cart-view space-y-6 pb-24">
            <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-900 mb-1"><Trans>Bulk Order Cart</Trans></h2>
                <p className="text-sm text-gray-500">{totalItemsCount} {totalItemsCount === 1 ? <Trans>item</Trans> : <Trans>items</Trans>}</p>
            </div>

            <div className="space-y-4">
                {groupedCartItems.map((group, groupIndex) => (
                    <div
                        key={group.productId || `cart-group-${groupIndex}`}
                        className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden"
                    >
                        {/* Product Header */}
                        <div className="flex gap-3 p-4 border-b border-gray-50">
                            <div className="flex-shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-gray-50">
                                <img src={group.image} alt={group.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2"><TransText>{group.name}</TransText></h3>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] font-bold rounded-full uppercase"><Trans>Wholesale Stock</Trans></span>
                                </div>
                            </div>
                        </div>

                        {/* Variants List */}
                        <div className="p-4 space-y-3">
                            {group.variants.map((variant, variantIdx) => {
                                const variantId = variant.id
                                const isExpanded = expandedVariants[variantId] || false

                                return (
                                    <div key={variantId} className="rounded-xl bg-gray-50/50 border border-gray-100 overflow-hidden">
                                        {/* Variant Header */}
                                        <button
                                            type="button"
                                            onClick={() => setExpandedVariants(prev => ({ ...prev, [variantId]: !prev[variantId] }))}
                                            className="w-full flex items-start justify-between gap-3 p-3 hover:bg-white transition-colors"
                                        >
                                            <div className="flex-1 min-w-0 text-left">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-bold text-gray-900"><Trans>Package</Trans> {variantIdx + 1}</span>
                                                </div>

                                                {variant.variantAttributes && Object.keys(variant.variantAttributes).length > 0 && (
                                                    <div className="text-xs text-gray-600">
                                                        {Object.entries(variant.variantAttributes).map(([key, value]) => (
                                                            <span key={key} className="mr-2">
                                                                <span className="font-medium">{key}:</span> {value}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="text-sm font-bold text-green-600 mt-1">
                                                    ₹{(variant.unitPrice || 0).toLocaleString('en-IN')} <span className="text-[10px] text-gray-500 font-normal">/ unit</span>
                                                </div>
                                            </div>
                                            <ChevronRightIcon
                                                className={cn(
                                                    "h-4 w-4 text-gray-400 transition-transform shrink-0",
                                                    isExpanded && "rotate-90"
                                                )}
                                            />
                                        </button>

                                        {isExpanded && (
                                            <div className="px-3 pb-3 bg-white border-t border-gray-50">
                                                <div className="pt-2 text-[10px] text-gray-500 italic">
                                                    <Trans>Standard wholesale packaging applicable for this item.</Trans>
                                                </div>
                                            </div>
                                        )}

                                        {/* Controls */}
                                        <div className="flex items-center justify-between gap-3 p-3 border-t border-gray-50 bg-gray-50/30">
                                            <div className="flex items-center gap-2 border border-gray-200 rounded-xl bg-white">
                                                <button
                                                    type="button"
                                                    className="p-1.5 hover:bg-gray-50 transition-colors"
                                                    onClick={() => {
                                                        const currentQty = optimisticQuantities[variantId] !== undefined ? optimisticQuantities[variantId] : variant.quantity
                                                        const newQty = Math.max(1, currentQty - 1)
                                                        setOptimisticQuantities(prev => ({ ...prev, [variantId]: newQty }))
                                                        onUpdateQuantity(variant.productId, variant.variantAttributes, newQty)
                                                    }}
                                                    disabled={(optimisticQuantities[variantId] !== undefined ? optimisticQuantities[variantId] : variant.quantity) <= 1}
                                                >
                                                    <MinusIcon className="h-4 w-4" />
                                                </button>
                                                <span className="px-2 text-sm font-semibold text-gray-900 min-w-[2rem] text-center">
                                                    {optimisticQuantities[variantId] !== undefined ? optimisticQuantities[variantId] : variant.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="p-1.5 hover:bg-gray-50 transition-colors"
                                                    onClick={() => {
                                                        const currentQty = optimisticQuantities[variantId] !== undefined ? optimisticQuantities[variantId] : variant.quantity
                                                        const newQty = currentQty + 1
                                                        setOptimisticQuantities(prev => ({ ...prev, [variantId]: newQty }))
                                                        onUpdateQuantity(variant.productId, variant.variantAttributes, newQty)
                                                    }}
                                                >
                                                    <PlusIcon className="h-4 w-4" />
                                                </button>
                                            </div>

                                            <div className="text-right flex-1">
                                                <div className="text-base font-bold text-gray-900">
                                                    ₹{((variant.unitPrice || 0) * (optimisticQuantities[variantId] !== undefined ? optimisticQuantities[variantId] : variant.quantity)).toLocaleString('en-IN')}
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                onClick={() => onRemove(variant.productId, variant.variantAttributes)}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm space-y-3">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500"><Trans>Subtotal</Trans></span>
                    <span className="font-semibold text-gray-900">₹{totals.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500"><Trans>Delivery Charges</Trans></span>
                    <span className="font-semibold text-green-600"><Trans>FREE</Trans></span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <span className="text-base font-bold text-gray-900"><Trans>Total Payable</Trans></span>
                    <span className="text-xl font-bold text-green-600">₹{totals.total.toLocaleString('en-IN')}</span>
                </div>

                {!totals.meetsMinimum && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                        <p className="text-xs font-semibold text-amber-700 text-center">
                            <Trans>Min purchase of ₹{MIN_VENDOR_PURCHASE.toLocaleString('en-IN')} required for wholesale orders.</Trans>
                            <br />
                            <Trans>Add ₹{totals.shortfall.toLocaleString('en-IN')} more to proceed.</Trans>
                        </p>
                    </div>
                )}
            </div>

            <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 -mx-4 z-10 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)]">
                <button
                    type="button"
                    className={cn(
                        'w-full py-4 px-6 rounded-2xl text-base font-bold transition-all duration-200',
                        totals.meetsMinimum
                            ? 'bg-green-600 text-white shadow-lg active:scale-95'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    )}
                    onClick={onCheckout}
                    disabled={!totals.meetsMinimum}
                >
                    {totals.meetsMinimum ? <Trans>Proceed to Checkout</Trans> : <Trans>Add ₹{totals.shortfall.toLocaleString('en-IN')} more</Trans>}
                </button>
            </div>

            {suggestedProducts.length > 0 && (
                <div className="pt-4 pb-12">
                    <h3 className="text-base font-bold text-gray-900 mb-3 ml-1"><Trans>Other Catalog Items</Trans></h3>
                    <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar -mx-4 px-4">
                        {suggestedProducts.map((product) => (
                            <div
                                key={product._id || product.id}
                                className="flex-shrink-0 w-36 bg-white rounded-xl border border-gray-100 p-2 shadow-sm"
                                onClick={() => onNavigateToProduct?.(product._id || product.id)}
                            >
                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 mb-2">
                                    <img src={getPrimaryImageUrl(product)} alt={product.name} className="w-full h-full object-cover" />
                                </div>
                                <h4 className="text-[10px] font-bold text-gray-900 line-clamp-1 mb-1"><TransText>{product.name}</TransText></h4>
                                <p className="text-[12px] font-bold text-green-600">
                                    ₹{((product.attributeStocks && product.attributeStocks.length > 0)
                                        ? Math.min(...product.attributeStocks.map(a => a.vendorPrice))
                                        : (product.priceToVendor || product.price || 0)).toLocaleString('en-IN')}
                                </p>
                                <button className="w-full mt-2 py-1 text-[10px] font-bold text-green-600 border border-green-600 rounded-lg">
                                    <Trans>View</Trans>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
