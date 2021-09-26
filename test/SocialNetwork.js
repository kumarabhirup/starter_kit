/* eslint-disable no-undef */

const { assert } = require("chai")

const SocialNetwork = artifacts.require("./SocialNetwork.sol")

require("chai")
  .use(require("chai-as-promised"))
  .should()

contract('SocialNetwork', ([deployer, author, tipper]) => {
  let socialNetwork

  before(async () => {
    socialNetwork = await SocialNetwork.deployed()
  })

  describe('deployment', () => {
    it('deploys successfully', async () => {
      const address = await socialNetwork.address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })

    it('has a name', async () => {
      const name = await socialNetwork.name()
      assert.equal(name, 'Web3 Social Network')
    })
  });

  describe('posts', () => {
    let result, postCount

    it('creates posts', async () => {
      result = await socialNetwork.createPost("this is my first post", { from: author })
      postCount = await socialNetwork.postCount()
      assert.equal(postCount, 1)

      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), postCount.toNumber(), 'id is correct')
      assert.equal(event.content, 'this is my first post', 'content is correct')
      assert.equal(event.tipAmount, '0', 'tip amount is correct')
      assert.equal(event.author, author, 'author is correct')

      await socialNetwork.createPost("", { from: author }).should.be.rejected
    })

    it('lists posts', async () => {
      const post = await socialNetwork.posts(postCount)
      assert.equal(post.id.toNumber(), postCount.toNumber(), 'id is correct')
      assert.equal(post.content, 'this is my first post', 'content is correct')
      assert.equal(post.tipAmount, '0', 'tip amount is correct')
      assert.equal(post.author, author, 'author is correct')
    })

    it('allows users to tip posts', async () => {
      // track author balance before txn
      let oldAuthorBalance
      oldAuthorBalance = await web3.eth.getBalance(author)
      oldAuthorBalance = new web3.utils.BN(oldAuthorBalance)

      // 1 ether = 10^18 wei
      const result = await socialNetwork.tipPost(postCount, { from: tipper, value: web3.utils.toWei('1', 'Ether') })
      
      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), postCount.toNumber(), 'id is correct')
      assert.equal(event.tipAmount, web3.utils.toWei('1', 'Ether'), 'tip amount is correct')
      assert.equal(event.tipper, tipper, 'tipper is correct')

      const post = await socialNetwork.posts(postCount)
      assert.equal(post.tipAmount, web3.utils.toWei('1', 'Ether'), 'post total tip amount is correct')

      // New author balance after txn
      let newAuthorBalance
      newAuthorBalance = await web3.eth.getBalance(author)
      newAuthorBalance = new web3.utils.BN(newAuthorBalance)

      // tip amount
      let tipAmount
      tipAmount = web3.utils.toWei('1', 'Ether')
      tipAmount = new web3.utils.BN(tipAmount)

      // expected balance
      const expectedBalance = oldAuthorBalance.add(tipAmount)

      // new bal - old bal = tip amount
      // assert.equal(newAuthorBalance - oldAuthorBalance, tipAmount, 'author received tip')
      assert.equal(newAuthorBalance.toString(), expectedBalance.toString(), 'author received tip')

      // tip a post that does not exist
      await socialNetwork.tipPost(99, { from: tipper, value: web3.utils.toWei('1', 'Ether') }).should.be.rejected
    })
  });
})