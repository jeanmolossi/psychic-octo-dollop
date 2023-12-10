'use client';

import React, { useCallback } from 'react'

const Dots = () => {
    const el = useCallback((element: any) => {
        let counter = 0;

        setInterval(() => {
            if (counter > 3) counter = 0

            if (element)
                element.innerHTML = '.'.repeat(counter)

            counter++
        }, 1000)
    }, [])

  return (
    <span ref={el}></span>
  )
}

export default Dots
