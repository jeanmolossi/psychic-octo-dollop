import Loader from '@/components/global/loader'
import Dots from '@/components/global/loading-dots'
import React from 'react'



const Loading = () => {
  return (
    <div className='relative h-screen block'>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            <Loader />
            Loading
            <Dots />
        </div>
    </div>
  )
}

export default Loading
