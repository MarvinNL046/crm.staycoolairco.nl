import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create initial categories
  const techCategory = await prisma.category.create({
    data: {
      name: 'Technology',
      slug: 'technology',
      description: 'Articles about technology and programming'
    }
  })

  const blogCategory = await prisma.category.create({
    data: {
      name: 'Blog',
      slug: 'blog',
      description: 'General blog posts'
    }
  })

  // Create initial tags
  const reactTag = await prisma.tag.create({
    data: {
      name: 'React',
      slug: 'react'
    }
  })

  const nextjsTag = await prisma.tag.create({
    data: {
      name: 'Next.js',
      slug: 'nextjs'
    }
  })

  const cmsTag = await prisma.tag.create({
    data: {
      name: 'CMS',
      slug: 'cms'
    }
  })

  console.log('Database has been seeded! 🌱')
  console.log('Categories:', { techCategory, blogCategory })
  console.log('Tags:', { reactTag, nextjsTag, cmsTag })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })