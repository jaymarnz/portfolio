// Copyright © 2025 jaymarnz, https://github.com/jaymarnz
// See LICENSE for details

const PageWrapper = ({ styles, children }) => {
  return (
    <div className={`mx-auto px-[4%] max-sm:px-0 max-w-[3840px]`} style={styles}>
      {children}
    </div>
  );
};

export default PageWrapper;
