import React from 'react'
import Blogwizard from './components/blog-wizard'

type Props = {}

export default function page({}: Props) {
  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Blogwizard />
    </div>
  )
}