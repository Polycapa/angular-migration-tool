export abstract class UnitTest {
  public isDescribe() {
    return false;
  }

  public isBeforeEach() {
    return false;
  }

  public isIt() {
    return false;
  }

  public isXit() {
    return false;
  }
}
