import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { BulletListInput } from './BulletListInput'

function Harness({ initial = [] as string[] }) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <BulletListInput label="Details" value={value} onChange={setValue} />
      <output>{JSON.stringify(value)}</output>
    </>
  )
}

const bullets = () => screen.getAllByRole('textbox')
const value = () => JSON.parse(screen.getByRole('status').textContent!)

describe('BulletListInput', () => {
  it('always shows one line to type in', () => {
    render(<Harness />)
    expect(bullets()).toHaveLength(1)
  })

  it('Enter starts a new bullet and focuses it', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.type(bullets()[0], 'Sand{Enter}Prime')
    expect(value()).toEqual(['Sand', 'Prime'])
    expect(bullets()[1]).toHaveFocus()
  })

  it('Backspace on an empty bullet removes it and focuses the one before', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['Sand', '']} />)
    await user.click(bullets()[1])
    await user.keyboard('{Backspace}')
    expect(value()).toEqual(['Sand'])
    expect(bullets()[0]).toHaveFocus()
  })

  it('removing the last bullet leaves one empty line', async () => {
    const user = userEvent.setup()
    render(<Harness initial={['Sand']} />)
    await user.click(screen.getByRole('button', { name: 'Remove bullet 1' }))
    expect(value()).toEqual([''])
    expect(bullets()).toHaveLength(1)
  })
})
