pragma solidity ^0.5.0;

contract SocialNetwork {
  string public name;

  uint public postCount = 0;

  mapping(uint => Post) public posts;

  event PostCreated(
    uint id,
    string content,
    uint tipAmount,
    address payable author
  );

  event PostTipped(
    uint id,
    uint tipAmount,
    address payable tipper
  );

  struct Post {
    uint id;
    string content;
    uint tipAmount;
    address payable author;
  }

  constructor() public {
    name = "Web3 Social Network";
  }

  function createPost(string memory _content) public {
    // require valid content
    require(bytes(_content).length > 0);

    // increment the post count
    postCount++;
    posts[postCount] = Post(postCount, _content, 0, msg.sender);

    // trigger event
    emit PostCreated(postCount, _content, 0, msg.sender);
  }

  function tipPost(uint _id) public payable {
    // make sure post id is valid
    require(_id > 0 && _id <= postCount);

    // fetch post
    Post memory post = posts[_id];

    // fetch author
    address payable author = post.author;

    // increment the tip amount
    post.tipAmount = post.tipAmount + msg.value;

    // update the post
    posts[_id] = post;

    // pay the author
    address(author).transfer(msg.value);

    // trigger event
    emit PostTipped(_id, msg.value, msg.sender);
  }
}
