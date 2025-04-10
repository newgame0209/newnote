
import { useEffect, useState } from "react"

const MOBILE_BREAKPOINT = 1024 // iPadも含めるために閾値を大きくする

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const checkMobile = () => {
      const width = window.innerWidth
      setIsMobile(width < MOBILE_BREAKPOINT)
    }

    // 初期チェック
    checkMobile()

    // リサイズイベントのリスナーを追加
    window.addEventListener('resize', checkMobile)

    // クリーンアップ
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}
